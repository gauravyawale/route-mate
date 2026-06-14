import { query, queryOne } from "../../infrastructure/db/client.js";
export interface AdminStats {
  pending_applications: number;
  total_users: number;
  total_drivers: number;
  active_rides: number;
  completed_rides: number;
  total_revenue: number;
}

export interface AdminRideRow {
  id: string;
  origin_address: string;
  destination_address: string;
  scheduled_at: Date;
  seats_total: number;
  seats_available: number;
  price_per_seat: string;
  status: string;
  created_at: Date;
  driver_name: string;
  driver_phone: string;
  vehicle_make: string;
  vehicle_model: string;
  plate_number: string;
  booking_count: string;
}

export interface AdminRideListResponse {
  id: string;
  origin_address: string;
  destination_address: string;
  scheduled_at: Date;
  seats_total: number;
  seats_available: number;
  price_per_seat: number;
  status: string;
  created_at: Date;
  driver: {
    name: string;
    phone: string;
  };
  vehicle: {
    make: string;
    model: string;
    plate_number: string;
  };
  booking_count: number;
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

  async getRides(statusFilter?: string): Promise<AdminRideListResponse[]> {
    const rows = await query<AdminRideRow>(
      `SELECT
      r.id,
      r.origin_address,
      r.destination_address,
      r.scheduled_at,
      r.seats_total,
      r.seats_available,
      r.price_per_seat,
      r.status,
      r.created_at,
      u.full_name AS driver_name,
      u.phone     AS driver_phone,
      v.make      AS vehicle_make,
      v.model     AS vehicle_model,
      v.plate_number,
      (SELECT COUNT(*) FROM bookings b WHERE b.ride_id = r.id) AS booking_count
    FROM rides r
    JOIN driver_profiles dp ON dp.id = r.driver_id
    JOIN users u            ON u.id  = dp.user_id
    JOIN vehicles v         ON v.id  = r.vehicle_id
    ${statusFilter ? "WHERE r.status = $1" : ""}
    ORDER BY r.created_at DESC
    LIMIT 100`,
      statusFilter ? [statusFilter] : [],
    );

    return rows.map((row) => ({
      id: row.id,
      origin_address: row.origin_address,
      destination_address: row.destination_address,
      scheduled_at: row.scheduled_at,
      seats_total: row.seats_total,
      seats_available: row.seats_available,
      price_per_seat: parseFloat(row.price_per_seat),
      status: row.status,
      created_at: row.created_at,
      driver: {
        name: row.driver_name,
        phone: row.driver_phone,
      },
      vehicle: {
        make: row.vehicle_make,
        model: row.vehicle_model,
        plate_number: row.plate_number,
      },
      booking_count: parseInt(row.booking_count),
    }));
  }
}

export const adminService = new AdminService();
