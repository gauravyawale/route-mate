import type {
  Ride,
  RideDetailResponse,
  RideResponse,
  User,
  UserResponse,
  Vehicle,
  VehicleResponse,
} from "@route-mate/shared";
import { RideDetailRow } from "../modules/rides/rides.service";

export function formatUser(user: User): UserResponse {
  return {
    id: user.id,
    phone: user.phone,
    email: user.email,
    full_name: user.full_name,
    avatar_url: user.avatar_url,
    is_verified: user.is_verified,
    is_driver_approved: user.is_driver_approved,
    active_mode: user.active_mode,
  };
}

export function formatVehicle(vehicle: Vehicle): VehicleResponse {
  return {
    id: vehicle.id,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    color: vehicle.color,
    plate_number: vehicle.plate_number,
    total_seats: vehicle.total_seats,
    vehicle_type: vehicle.vehicle_type,
    is_active: vehicle.is_active,
  };
}

export function formatRide(ride: Ride): RideResponse {
  return {
    id: ride.id,
    origin_address: ride.origin_address,
    destination_address: ride.destination_address,
    scheduled_at: ride.scheduled_at,
    seats_total: ride.seats_total,
    seats_available: ride.seats_available,
    price_per_seat: ride.price_per_seat,
    status: ride.status,
  };
}

export function formatRideDetail(row: RideDetailRow): RideDetailResponse {
  return {
    id: row.id,
    origin_address: row.origin_address,
    destination_address: row.destination_address,
    scheduled_at: row.scheduled_at,
    seats_total: row.seats_total,
    seats_available: row.seats_available,
    price_per_seat: parseFloat(row.price_per_seat), // NUMERIC → number
    status: row.status,
    created_at: row.created_at,
    driver: {
      id: row.driver_user_id,
      full_name: row.driver_name,
      avatar_url: row.driver_avatar,
      rating: parseFloat(row.driver_rating), // NUMERIC(3,2) → number
      total_rides: row.driver_total_rides,
    },
    vehicle: {
      id: row.vehicle_id,
      make: row.make,
      model: row.model,
      year: row.year,
      color: row.color,
      plate_number: row.plate_number,
      vehicle_type: row.vehicle_type,
      total_seats: row.total_seats,
    },
  };
}
