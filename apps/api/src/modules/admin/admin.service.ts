import { query, queryOne } from "../../infrastructure/db/client.js";
import { NotFoundError } from "../../utils/errors.js";
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

export interface AdminRideDetailResponse {
  id: string;
  origin_address: string;
  destination_address: string;
  scheduled_at: Date;
  seats_total: number;
  seats_available: number;
  price_per_seat: number;
  status: string;
  cancelled_reason: string | null;
  started_at: Date | null;
  completed_at: Date | null;
  created_at: Date;
  driver: {
    id: string;
    name: string;
    phone: string;
    rating: number;
    total_rides: number;
  };
  vehicle: {
    make: string;
    model: string;
    year: number;
    color: string;
    plate_number: string;
    vehicle_type: string;
  };
  bookings: Array<{
    id: string;
    status: string;
    seats_booked: number;
    total_amount: number;
    hop_in_address: string | null;
    hop_off_address: string | null;
    confirmed_at: Date | null;
    paid_at: Date | null;
    created_at: Date;
    rider: {
      id: string;
      full_name: string;
      phone: string;
    };
  }>;
}

export interface AdminUserRow {
  id: string;
  phone: string;
  email: string | null;
  full_name: string;
  avatar_url: string | null;
  is_verified: boolean;
  is_driver_approved: boolean;
  active_mode: string;
  no_show_count: number;
  role: string;
  created_at: Date;
  driver_rating: string | null;
  driver_total_rides: number | null;
}

export interface AdminUserResponse {
  id: string;
  phone: string;
  email: string | null;
  full_name: string;
  avatar_url: string | null;
  is_verified: boolean;
  is_driver_approved: boolean;
  active_mode: string;
  no_show_count: number;
  role: string;
  created_at: Date;
  driver_rating: number | null;
  driver_total_rides: number | null;
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

  async getRideDetail(rideId: string): Promise<AdminRideDetailResponse> {
    const ride = await queryOne<{
      id: string;
      origin_address: string;
      destination_address: string;
      scheduled_at: Date;
      seats_total: number;
      seats_available: number;
      price_per_seat: string;
      status: string;
      cancelled_reason: string | null;
      started_at: Date | null;
      completed_at: Date | null;
      created_at: Date;
      driver_id: string;
      driver_name: string;
      driver_phone: string;
      driver_rating: string;
      driver_total_rides: number;
      vehicle_make: string;
      vehicle_model: string;
      vehicle_year: number;
      vehicle_color: string;
      plate_number: string;
      vehicle_type: string;
    }>(
      `SELECT
      r.id, r.origin_address, r.destination_address, r.scheduled_at,
      r.seats_total, r.seats_available, r.price_per_seat, r.status,
      r.cancelled_reason, r.started_at, r.completed_at, r.created_at,
      u.id        AS driver_id,
      u.full_name AS driver_name,
      u.phone     AS driver_phone,
      dp.rating   AS driver_rating,
      dp.total_rides AS driver_total_rides,
      v.make AS vehicle_make,
      v.model AS vehicle_model,
      v.year AS vehicle_year,
      v.color AS vehicle_color,
      v.plate_number,
      v.vehicle_type
    FROM rides r
    JOIN driver_profiles dp ON dp.id = r.driver_id
    JOIN users u            ON u.id  = dp.user_id
    JOIN vehicles v         ON v.id  = r.vehicle_id
    WHERE r.id = $1`,
      [rideId],
    );

    if (!ride) throw new NotFoundError("Ride not found.");

    const bookings = await query<{
      id: string;
      status: string;
      seats_booked: number;
      total_amount: string;
      hop_in_address: string | null;
      hop_off_address: string | null;
      confirmed_at: Date | null;
      paid_at: Date | null;
      created_at: Date;
      rider_id: string;
      rider_name: string;
      rider_phone: string;
    }>(
      `SELECT
      b.id, b.status, b.seats_booked, b.total_amount,
      b.hop_in_address, b.hop_off_address,
      b.confirmed_at, b.paid_at, b.created_at,
      u.id AS rider_id, u.full_name AS rider_name, u.phone AS rider_phone
    FROM bookings b
    JOIN users u ON u.id = b.rider_id
    WHERE b.ride_id = $1
    ORDER BY b.created_at ASC`,
      [rideId],
    );

    return {
      id: ride.id,
      origin_address: ride.origin_address,
      destination_address: ride.destination_address,
      scheduled_at: ride.scheduled_at,
      seats_total: ride.seats_total,
      seats_available: ride.seats_available,
      price_per_seat: parseFloat(ride.price_per_seat),
      status: ride.status,
      cancelled_reason: ride.cancelled_reason,
      started_at: ride.started_at,
      completed_at: ride.completed_at,
      created_at: ride.created_at,
      driver: {
        id: ride.driver_id,
        name: ride.driver_name,
        phone: ride.driver_phone,
        rating: parseFloat(ride.driver_rating),
        total_rides: ride.driver_total_rides,
      },
      vehicle: {
        make: ride.vehicle_make,
        model: ride.vehicle_model,
        year: ride.vehicle_year,
        color: ride.vehicle_color,
        plate_number: ride.plate_number,
        vehicle_type: ride.vehicle_type,
      },
      bookings: bookings.map((b) => ({
        id: b.id,
        status: b.status,
        seats_booked: b.seats_booked,
        total_amount: parseFloat(b.total_amount),
        hop_in_address: b.hop_in_address,
        hop_off_address: b.hop_off_address,
        confirmed_at: b.confirmed_at,
        paid_at: b.paid_at,
        created_at: b.created_at,
        rider: {
          id: b.rider_id,
          full_name: b.rider_name,
          phone: b.rider_phone,
        },
      })),
    };
  }

  async getUsers(search?: string): Promise<AdminUserResponse[]> {
    const rows = await query<AdminUserRow>(
      `SELECT
      u.id, u.phone, u.email, u.full_name, u.avatar_url,
      u.is_verified, u.is_driver_approved, u.active_mode,
      u.no_show_count, u.role, u.created_at,
      dp.rating      AS driver_rating,
      dp.total_rides AS driver_total_rides
    FROM users u
    LEFT JOIN driver_profiles dp ON dp.user_id = u.id
    ${search ? "WHERE u.full_name ILIKE $1 OR u.phone ILIKE $1" : ""}
    ORDER BY u.created_at DESC
    LIMIT 200`,
      search ? [`%${search}%`] : [],
    );

    return rows.map((row) => ({
      id: row.id,
      phone: row.phone,
      email: row.email,
      full_name: row.full_name,
      avatar_url: row.avatar_url,
      is_verified: row.is_verified,
      is_driver_approved: row.is_driver_approved,
      active_mode: row.active_mode,
      no_show_count: row.no_show_count,
      role: row.role,
      created_at: row.created_at,
      driver_rating: row.driver_rating ? parseFloat(row.driver_rating) : null,
      driver_total_rides: row.driver_total_rides,
    }));
  }
}

export const adminService = new AdminService();
