import { FastifyRequest, FastifyReply } from "fastify";
import { UnauthorizedError, AppError } from "../utils/errors";

/**
 * check user active mode
 * Use for routes that only drivers OR riders can access
 */

export const requireMode = (mode: "driver" | "rider") => {
  return async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError("User not authenticated");
    }

    if (req.user.active_mode !== mode) {
      throw new AppError(
        `This action requires ${mode} mode. Switch your mode and try again.`,
        403,
        "WRONG_MODE",
      );
    }
  };
};

/**
 * check driver has completed onboarding
 * Use for routes that only approved drivers can access
 */

export const requireDriverApproved = async (
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  if (!req.user.is_driver_approved) {
    throw new AppError(
      "Driver profile not approved yet. Complete onboarding first.",
      403,
      "DRIVER_NOT_APPROVED",
    );
  }
};

/**
 * check user has verified phone number
 * All authenticated users should have verified. but belt-and-suspenders
 */

export const requireVerified = async (
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  if (!req.user.is_verified) {
    throw new AppError("Phone number not verified.", 403, "NOT_VERIFIED");
  }
};

/**
 * check user has admin role
 * Use for all admin endpoints
 */
export const requireAdmin = async (
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  if (!req.user) {
    throw new UnauthorizedError("User not authenticated");
  }

  if (req.user.role !== "admin") {
    throw new AppError("Admin access required.", 403, "FORBIDDEN");
  }
};
