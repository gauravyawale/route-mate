import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { queryOne } from "../infrastructure/db/client";
import { UnauthorizedError } from "../utils/errors";
import { verify } from "crypto";

// ─── Extend Fastify Request to incluse user ───────────────────────────────────

// tell TypeScript that our FastifyRequest has a `user` property
declare module "fastify" {
  interface FastifyRequest {
    user: {
      id: string;
      phone: string;
      active_mode: "rider" | "driver";
      is_verified: boolean;
      is_driver_approved: boolean;
    };
  }
}

interface JwtPayload {
  sub: string;
  mode: string;
  iat: number;
  exp: number;
}

interface UserRow {
  id: string;
  phone: string;
  active_mode: "rider" | "driver";
  is_verified: boolean;
  is_driver_approved: boolean;
}

export const authenticate = async (
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  // Extract Token
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing or invalid authorization header");
  }

  const token = authHeader.split(" ")[1];

  // Verify Token
  let paylaod: JwtPayload;

  try {
    paylaod = jwt.verify(token, config.JWT_SECRET) as JwtPayload;
  } catch (err: unknown) {
    const isExpired = err instanceof jwt.TokenExpiredError;
    throw new UnauthorizedError(
      isExpired ? "Access token expired" : "Invalid access token",
    );
  }

  // Check user status in DB
  const user = await queryOne<UserRow>(
    `SELECT id, phone, active_mode, is_verified, is_driver_approved
     FROM users
     WHERE id = $1`,
    [paylaod.sub],
  );

  if (!user) {
    throw new UnauthorizedError("User not found");
  }

  // Attach user info to request for downstream handlers
  req.user = user;
};
