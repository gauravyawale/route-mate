import type {
  BookingResponse, // add
  BookingStatus,
  Ride,
  RideDetailResponse,
  RideResponse,
  RideStatus,
  User,
  UserResponse,
  Vehicle,
  VehicleResponse,
} from "@route-mate/shared";
import { RideDetailRow } from "../modules/rides/rides.service";

export interface BookingRow {
  id: string;
  ride_id: string;
  rider_id: string;
  seats_booked: number;
  total_amount: string; // pg returns NUMERIC as string
  status: string;
  confirmed_at: Date | null;
  paid_at: Date | null;
  no_show_reported_at: Date | null;
  hop_in_address: string | null;
  hop_off_address: string | null;
  created_at: Date;
  updated_at: Date;
  // joined fields
  ride_origin_address: string;
  ride_destination_address: string;
  ride_scheduled_at: Date;
  ride_price_per_seat: string;
  ride_status: string;
  rider_full_name: string;
  rider_avatar_url: string | null;
  rider_phone: string;
}

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

export function formatBooking(row: BookingRow): BookingResponse {
  return {
    id: row.id,
    status: row.status as BookingStatus,
    seats_booked: row.seats_booked,
    total_amount: parseFloat(row.total_amount),
    confirmed_at: row.confirmed_at,
    paid_at: row.paid_at,
    created_at: row.created_at,
    ride: {
      id: row.ride_id,
      origin_address: row.ride_origin_address,
      destination_address: row.ride_destination_address,
      scheduled_at: row.ride_scheduled_at,
      price_per_seat: parseFloat(row.ride_price_per_seat),
      status: row.ride_status as RideStatus,
    },
    hop_in_address: row.hop_in_address,
    hop_off_address: row.hop_off_address,
    rider: {
      id: row.rider_id,
      full_name: row.rider_full_name,
      avatar_url: row.rider_avatar_url,
      phone: row.rider_phone,
    },
  };
}
