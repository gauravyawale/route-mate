import { query, queryOne } from "../../infrastructure/db/client.js";

export interface AdminStats {
  pending_applications: number;
  total_users: number;
  total_drivers: number;
  active_rides: number;
  completed_rides: number;
  total_revenue: number;
}

export class AdminService {
  async getStats(): Promise<AdminStats> {
    const [
      pendingApps,
      totalUsers,
      totalDrivers,
      activeRides,
      completedRides,
      revenue,
    ] = await Promise.all([
      queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM driver_applications WHERE status = 'pending'`,
      ),
      queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM users`),
      queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM driver_profiles`,
      ),
      queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM rides WHERE status IN ('open', 'in_progress')`,
      ),
      queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM rides WHERE status = 'completed'`,
      ),
      queryOne<{ total: string | null }>(
        `SELECT SUM(amount) as total FROM payments WHERE status = 'success'`,
      ),
    ]);

    return {
      pending_applications: parseInt(pendingApps?.count ?? "0"),
      total_users: parseInt(totalUsers?.count ?? "0"),
      total_drivers: parseInt(totalDrivers?.count ?? "0"),
      active_rides: parseInt(activeRides?.count ?? "0"),
      completed_rides: parseInt(completedRides?.count ?? "0"),
      total_revenue: parseFloat(revenue?.total ?? "0"),
    };
  }
}

export const adminService = new AdminService();
