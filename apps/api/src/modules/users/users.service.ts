import { queryOne, query, execute } from "../../infrastructure/db/client.js";
import { AppError, NotFoundError } from "../../utils/errors.js";
import type {
  SwitchModeInput,
  UpdateProfileInput,
  User,
  UserResponse,
} from "@route-mate/shared";
import { formatUser } from "../../utils/formatters.js";

export class UsersService {
  /**
   * Get ME
   * Fetch the authenticated user's profile information.
   */
  async getMe(userId: string): Promise<UserResponse> {
    const user = await queryOne<User>(
      `SELECT id, phone, full_name, email, avatar_url,
                is_verified, is_driver_approved, active_mode, no_show_count,
                created_at, updated_at 
            FROM users
             WHERE id = $1`,
      [userId],
    );

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return formatUser(user);
  }

  /**
   * Update Profile
   * Partial update- only fields provided in the request body will be updated
   */
  async updateMe(
    userId: string,
    input: UpdateProfileInput,
  ): Promise<UserResponse> {
    // Build dynamic SET clause based on provided fields
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (input.full_name !== undefined) {
      updates.push(`full_name = $${paramIndex++}`);
      values.push(input.full_name);
    }

    if (input.email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(input.email);
    }

    if (input.avatar_url !== undefined) {
      updates.push(`avatar_url = $${paramIndex++}`);
      values.push(input.avatar_url);
    }

    if (updates.length === 0) {
      throw new AppError(
        "No valid fields provided for update",
        400,
        "NO_FIELDS",
      );
    }

    // update timestamp
    updates.push(`updated_at = NOW()`);

    // userId is the last parameter
    values.push(userId);

    const user = await queryOne<User>(
      `UPDATE users SET ${updates.join(", ")}
            WHERE id = $${paramIndex}
            RETURNING id, phone, full_name, email, avatar_url,
                is_verified, is_driver_approved, active_mode,
                no_show_count, created_at, updated_at`,
      values,
    );

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return formatUser(user);
  }

  /**
   * Switch Mode
   * Toggle between rider and driver modes
   * Driver swicth requires is_driver_approved to be true
   */
  async switchMode(
    userId: string,
    { mode }: SwitchModeInput,
  ): Promise<UserResponse> {
    // if switching to driver mode, check if user is approved as driver
    if (mode === "driver") {
      const user = await queryOne<{ is_driver_approved: boolean }>(
        `SELECT is_driver_approved FROM users WHERE id = $1`,
        [userId],
      );

      if (!user?.is_driver_approved) {
        throw new AppError(
          "Complete  driver onboarding before switching to driver mode",
          403,
          "DRIVER_NOT_APPROVED",
        );
      }
    }

    const updated = await queryOne<User>(
      `UPDATE users
            SET active_mode = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING id, phone, full_name, email, avatar_url,
                is_verified, is_driver_approved, active_mode,
                no_show_count, created_at, updated_at`,
      [mode, userId],
    );

    if (!updated) {
      throw new NotFoundError("User not found");
    }

    return formatUser(updated);
  }

  async savePushToken(userId: string, token: string): Promise<void> {
    console.log("[push] saving token for userId:", userId, "token:", token);
    const result = await queryOne(
      `UPDATE users SET expo_push_token = $1 WHERE id = $2 RETURNING id, expo_push_token`,
      [token, userId],
    );
    console.log("[push] update result:", result);
  }
}

export const usersService = new UsersService();
