import {
  ApplyDriverInput,
  DriverApplicationResponse,
  ReviewDriverInput,
} from "@route-mate/shared";
import {
  queryOne,
  query,
  withTransaction,
} from "../../infrastructure/db/client.js";
import { AppError, ConflictError, NotFoundError } from "../../utils/errors.js";
import {
  notifyDriverApproved,
  notifyDriverRejected,
} from "../../infrastructure/socket/notifications.js";

// Internal row types

interface ApplicationRow {
  id: string;
  user_id: string;
  license_number: string;
  license_expiry: string;
  status: string;
  rejection_reason: string | null;
  reviewed_at: Date | null;
  created_at: Date;
  updated_at: Date;
  // joined
  applicant_full_name: string | null;
  applicant_phone: string | null;
  applicant_avatar_url: string | null;
}

// Reusable SELECT
const APPLICATION_SELECT = `
  SELECT
    da.id,
    da.user_id,
    da.license_number,
    da.license_expiry,
    da.status,
    da.rejection_reason,
    da.reviewed_at,
    da.created_at,
    da.updated_at,
    u.full_name  AS applicant_full_name,
    u.phone      AS applicant_phone,
    u.avatar_url AS applicant_avatar_url
  FROM driver_applications da
  JOIN users u ON u.id = da.user_id
`;

function formatApplication(row: ApplicationRow): DriverApplicationResponse {
  return {
    id: row.id,
    user_id: row.user_id,
    license_number: row.license_number,
    license_expiry: row.license_expiry,
    status: row.status as any,
    rejection_reason: row.rejection_reason,
    reviewed_at: row.reviewed_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    applicant: {
      id: row.user_id,
      full_name: row.applicant_full_name ?? "",
      phone: row.applicant_phone ?? "",
      avatar_url: row.applicant_avatar_url,
    },
  };
}

export class OnboardingService {
  /**
   *  applyAsDriver
   * Called by: any authenticated user
   * Creates a pending driver application
   */

  async applyAsDriver(
    userId: string,
    input: ApplyDriverInput,
  ): Promise<DriverApplicationResponse> {
    // check if already a driver
    const existingProfile = await queryOne<{ id: string }>(
      `SELECT id FROM driver_profiles WHERE user_id = $1`,
      [userId],
    );

    if (existingProfile) {
      throw new ConflictError("You are already an approved driver.");
    }

    // check for existing application
    const existingApplication = await queryOne<{
      id: string;
      status: string;
    }>(`SELECT id, status FROM driver_applications WHERE user_id = $1`, [
      userId,
    ]);

    if (existingApplication) {
      if (existingApplication.status === "pending") {
        throw new ConflictError(
          "You already have a pending application. Please wait for review.",
        );
      }
      if (existingApplication.status === "approved") {
        throw new ConflictError("Your application has already been approved.");
      }
      // rejected — allow reapplication via upsert below
    }

    // create or update application
    // ON CONFLICT handles reapplication after rejection
    const application = await queryOne<ApplicationRow>(
      `INSERT INTO driver_applications (
        user_id, license_number, license_expiry
      ) VALUES ($1, $2, $3)
      ON CONFLICT (user_id) DO UPDATE SET
        license_number   = EXCLUDED.license_number,
        license_expiry   = EXCLUDED.license_expiry,
        status           = 'pending',
        rejection_reason = NULL,
        reviewed_by      = NULL,
        reviewed_at      = NULL,
        updated_at       = NOW()
      RETURNING
        id, user_id, license_number, license_expiry,
        status, rejection_reason, reviewed_at,
        created_at, updated_at,
        NULL AS applicant_full_name,
        NULL AS applicant_phone,
        NULL AS applicant_avatar_url`,
      [userId, input.license_number, input.license_expiry],
    );

    if (!application) throw new AppError("Failed to submit application.");

    return this.getApplicationByUserId(userId);
  }

  /**
   * getMyApplicationStatus
   * Called by: authenticated user
   * Returns their own application status
   */

  async getMyApplicationStatus(
    userId: string,
  ): Promise<DriverApplicationResponse> {
    const row = await queryOne<ApplicationRow>(
      `${APPLICATION_SELECT} WHERE da.user_id = $1`,
      [userId],
    );

    if (!row) throw new NotFoundError("No application found.");

    return formatApplication(row);
  }

  /**
   * getPendingApplications
   * Called by: admin
   * Returns all pending applications
   */
  async getPendingApplications(): Promise<DriverApplicationResponse[]> {
    const rows = await query<ApplicationRow>(
      `${APPLICATION_SELECT}
      WHERE da.status = 'pending'
      ORDER BY da.created_at ASC`,
      [],
    );

    return rows.map(formatApplication);
  }

  /**
   * approveDriver
   * Called by: admin
   * Atomically:
   *   1. marks application approved
   *   2. creates driver_profiles row
   *  3. sets is_driver_approved on users
   * All three must succeed or all rollback
   */
  async approveDriver(
    adminUserId: string,
    targetUserId: string,
  ): Promise<DriverApplicationResponse> {
    // 1. fetch application
    const application = await queryOne<{
      id: string;
      status: string;
      license_number: string;
      license_expiry: string;
    }>(
      `SELECT id, status, license_number, license_expiry
      FROM driver_applications
      WHERE user_id = $1`,
      [targetUserId],
    );

    if (!application) throw new NotFoundError("Application not found.");

    if (application.status !== "pending") {
      throw new AppError(`Application is already ${application.status}.`, 400);
    }

    // 2. atomic approval — three operations must all succeed
    await withTransaction(async (client) => {
      // mark application approved
      await client.query(
        `UPDATE driver_applications SET
          status      = 'approved',
          reviewed_by = $1,
          reviewed_at = NOW(),
          updated_at  = NOW()
        WHERE user_id = $2`,
        [adminUserId, targetUserId],
      );

      // create driver profile
      // this is the source of truth for driver approval
      await client.query(
        `INSERT INTO driver_profiles (
          user_id, license_number, license_expiry
        ) VALUES ($1, $2, $3)
        ON CONFLICT (user_id) DO NOTHING`,
        [targetUserId, application.license_number, application.license_expiry],
      );

      // set is_driver_approved flag on user
      // kept in sync for fast middleware checks without joining driver_profiles
      await client.query(
        `UPDATE users SET
          is_driver_approved = TRUE,
          updated_at         = NOW()
        WHERE id = $1`,
        [targetUserId],
      );
    });

    // 3. notify driver via socket
    notifyDriverApproved({ userIdToNotify: targetUserId });

    return this.getApplicationByUserId(targetUserId);
  }

  /**
   * rejectDriver
   * Called by: admin
   * Marks application rejected with reason
   * User can reapply after rejection
   */

  async rejectDriver(
    adminUserId: string,
    targetUserId: string,
    input: ReviewDriverInput,
  ): Promise<DriverApplicationResponse> {
    const application = await queryOne<{ id: string; status: string }>(
      `SELECT id, status FROM driver_applications WHERE user_id = $1`,
      [targetUserId],
    );

    if (!application) throw new NotFoundError("Application not found.");

    if (application.status !== "pending") {
      throw new AppError(`Application is already ${application.status}.`, 400);
    }

    await queryOne(
      `UPDATE driver_applications SET
        status           = 'rejected',
        rejection_reason = $1,
        reviewed_by      = $2,
        reviewed_at      = NOW(),
        updated_at       = NOW()
      WHERE user_id = $3
      RETURNING id`,
      [input.rejection_reason ?? null, adminUserId, targetUserId],
    );

    // notify driver via socket
    notifyDriverRejected({
      userIdToNotify: targetUserId,
      reason: input.rejection_reason,
    });

    return this.getApplicationByUserId(targetUserId);
  }

  /**
   * getApplicationByUserId — internal helper
   * Called by: internal
   * Returns application for a specific user
   */
  async getApplicationByUserId(
    userId: string,
  ): Promise<DriverApplicationResponse> {
    const row = await queryOne<ApplicationRow>(
      `${APPLICATION_SELECT} WHERE da.user_id = $1`,
      [userId],
    );

    if (!row) throw new NotFoundError("Application not found.");

    return formatApplication(row);
  }
}

export const onboardingService = new OnboardingService();
