import { createHash, randomInt } from "crypto";
import { config } from "../../config";
import { AUTH, SendOtpInput, VerifyOtpInput } from "@route-mate/shared";
import jwt from "jsonwebtoken";
import redis from "../../infrastructure/redis/client";
import { queryOne } from "../../infrastructure/db/client";
import { randomUUID } from "bullmq";
import {
  AppError,
  TooManyRequestsError,
  UnauthorizedError,
} from "../../utils/errors.js";
import { User } from "@route-mate/shared/types";

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface AuthResult {
  user: User;
  tokens: TokenPair;
  isNewUser: boolean;
}

// --- OTP Helper Functions --------------------------------

/**
 * Generate a 6-digit OTP code as a string.
 * randomInt is cryptographically secure and Math.random() is NOT
 */

const generateOtp = (): string => {
  return "123456".toString();
};

/**
 * Hash OTP with SHA-256 before storing in Redis.
 * Fast, one-way,a nd Redis breach exposes nothing useful.
 */

const hashOtp = (otp: string): string => {
  return createHash("sha256").update(otp).digest("hex");
};

/**
 * Redis key for OTP storage
 * Namespaced to avoid collisions with other redis keys
 */

const otpKey = (phone: string): string => {
  return `otp:${phone}`;
};

/**
 * Redis key for OTP attempt tracking
 * Seperate from OTP key, persists accross OTP regeneartions
 */
const otpAttemptsKey = (phone: string): string => {
  return `otp_attempts:${phone}`;
};

/**
 * Redis key for OTP request rate limiting
 * Tracks how many times OTP was requested, not attempted, so
 */
const otpRequestKey = (phone: string): string => {
  return `otp_requests:${phone}`;
};

/**
 * Redis key for refresh token storage
 * userId + jti makes each device's token uniquely identifiable
 */
const refreshTokenKey = (userId: string, jti: string): string => {
  return `refresh:${userId}:${jti}`;
};

// --- Token Helper Functions --------------------------------
const signAccessToken = (userId: string, mode: string): string => {
  return jwt.sign({ sub: userId, mode }, config.JWT_SECRET, {
    expiresIn: AUTH.ACCESS_TOKEN_EXPIRY,
  });
};

const signRefreshToken = (userId: string, jti: string): string => {
  return jwt.sign({ sub: userId, jti }, config.JWT_REFRESH_SECRET, {
    expiresIn: AUTH.REFRESH_TOKEN_EXPIRY,
  });
};

// --- SMS Helper Functions --------------------------------
const sendSms = async (phone: string, otp: string): Promise<void> => {
  if (config.NODE_ENV === "development") {
    //In development, we just log the OTP instead of sending an actual SMS
    console.log(`Sending OTP ${otp} to phone ${phone}`);
    return;
  }

  //TODO: sms provider integration, e.g. Twilio, MSG91, etc.
  throw new AppError("SMS sending not implemented", 501, "SMS_NOT_IMPLEMENTED");
};

/**
 * Combine country code + national number into E.164 format
 * This is the single canonical phone format used everywhere:
 * Redis keys, DB storage, JWT — never store/lookup parts separately
 */
const toE164 = (countryCode: string, phone: string): string => {
  return `${countryCode}${phone}`;
};

// --- Auth Service Functions --------------------------------

export class AuthService {
  /**
   * Send OTP
   * Rate limited: max 3 requests per 10 minutes
   */
  async sendOtp({
    country_code,
    phone,
  }: SendOtpInput): Promise<{ message: string }> {
    const e164Phone = toE164(country_code, phone);

    // Rate limit check
    const requestKey = otpRequestKey(e164Phone);
    const requestCount = await redis.incr(requestKey);

    if (requestCount === 1) {
      await redis.expire(requestKey, AUTH.OTP_RATE_WINDOW_SECONDS);
    }

    if (requestCount > AUTH.MAX_OTP_REQUESTS) {
      const ttl = await redis.ttl(requestKey);
      throw new TooManyRequestsError(
        `Too many OTP requests. Try again in ${Math.ceil(ttl / 60)} minutes.`,
      );
    }

    const otp = generateOtp();
    const hashedOtp = hashOtp(otp);

    await redis.setEx(otpKey(e164Phone), AUTH.OTP_EXPIRY_SECONDS, hashedOtp);
    await redis.del(otpAttemptsKey(e164Phone));

    await sendSms(e164Phone, otp);

    return { message: "OTP sent successfully" };
  }

  /**
   * Verify OTP
   * Rate limited: max 5 attempts per OTP
   * Upsert: creates user if first time, finds if returning user
   */
  async verifyOtp({
    country_code,
    phone,
    otp,
  }: VerifyOtpInput): Promise<AuthResult> {
    const e164Phone = toE164(country_code, phone);

    const storedHash = await redis.get(otpKey(e164Phone));

    if (!storedHash) {
      throw new AppError(
        "OTP expired or not requested. Please request a new OTP.",
        400,
        "OTP_EXPIRED",
      );
    }

    const attemptsKey = otpAttemptsKey(e164Phone);
    const attempts = await redis.incr(attemptsKey);

    if (attempts === 1) {
      await redis.expire(attemptsKey, AUTH.OTP_EXPIRY_SECONDS);
    }

    if (attempts > AUTH.MAX_OTP_ATTEMPTS) {
      await redis.del(otpKey(e164Phone));
      throw new TooManyRequestsError(
        "Too many OTP attempts. Please request a new OTP.",
      );
    }

    const hashedInput = hashOtp(otp);

    if (hashedInput !== storedHash) {
      const remaining = AUTH.MAX_OTP_ATTEMPTS - attempts;
      throw new AppError(
        `Invalid OTP. You have ${remaining} attempts left.`,
        400,
        "INVALID_OTP",
      );
    }

    await redis.del(otpKey(e164Phone));
    await redis.del(otpAttemptsKey(e164Phone));
    await redis.del(otpRequestKey(e164Phone));

    let isNewUser = false;

    let user = await queryOne<User>("SELECT * FROM users WHERE phone = $1", [
      e164Phone,
    ]);

    if (!user) {
      isNewUser = true;
      user = await queryOne<User>(
        `INSERT INTO users (phone, full_name, is_verified)
              VALUES ($1, $2, TRUE)
              RETURNING *`,
        [e164Phone, ""],
      );
    } else {
      if (!user.is_verified) {
        user = await queryOne<User>(
          `UPDATE users SET is_verified = TRUE, updated_at = NOW()
                  WHERE id = $1 RETURNING *`,
          [user.id],
        );
      }
    }

    if (!user) throw new Error("Failed to create or find user");

    const tokens = await this.issueTokenPair(user.id, user.active_mode);

    return { user, tokens, isNewUser };
  }

  /**
   * Refresh token
   * Rotates refresh token- old one blacklisted and new one issued
   */
  async refreshToken(token: string): Promise<TokenPair> {
    // verify refresh token signature
    let payload: { sub: string; jti: string };

    try {
      payload = jwt.verify(token, config.JWT_REFRESH_SECRET) as {
        sub: string;
        jti: string;
      };
    } catch (err) {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }

    const { sub: userId, jti } = payload;

    // check token exists in Redis (not blacklisted)
    const key = refreshTokenKey(userId, jti);
    const exists = await redis.get(key);

    if (!exists) {
      throw new UnauthorizedError("Refresh token revoked or expired");
    }

    // get user active mode for access token payload
    const user = await queryOne<User>(
      `SELECT id, active_mode FROM users WHERE id = $1`,
      [userId],
    );

    if (!user) throw new UnauthorizedError("User not found");

    // Rotate tokens: issue new pair and blacklist old refresh token
    await redis.del(key); // blacklist old refresh token
    const tokens = await this.issueTokenPair(userId, user.active_mode);

    return tokens;
  }

  /**
   * Logout by blacklisting refresh token
   */

  async logout(token: string): Promise<{ message: string }> {
    try {
      const payload = jwt.verify(token, config.JWT_REFRESH_SECRET) as {
        sub: string;
        jti: string;
      };

      //delete refresh token from Redis to blacklist
      await redis.del(refreshTokenKey(payload.sub, payload.jti));
    } catch (err) {
      // Even if token is invalid, we return success to avoid token fishing
      console.warn("Logout with invalid token:", err);
    }

    return { message: "Successfully logged out" };
  }

  /**
   * Issue access and refresh token pair, and store refresh token in Redis
   */
  private async issueTokenPair(
    userId: string,
    mode: string,
  ): Promise<TokenPair> {
    const jti = randomUUID();

    const accessToken = signAccessToken(userId, mode);
    const refreshToken = signRefreshToken(userId, jti);

    // Store refresh token in Redis with expiry for validation during refresh and logout
    await redis.setEx(
      refreshTokenKey(userId, jti),
      AUTH.REFRESH_TOKEN_EXPIRY_SECONDS,
      "valid",
    );

    return { accessToken, refreshToken };
  }
}

export const authService = new AuthService();
