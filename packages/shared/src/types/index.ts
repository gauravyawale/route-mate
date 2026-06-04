// User Interface
export interface User {
  id: string;
  phone: string;
  email: string | null;
  full_name: string;
  avatar_url: string | null;
  is_verified: boolean;
  is_driver_approved: boolean;
  active_mode: "rider" | "driver";
  no_show_count: number;
  created_at: Date;
  updated_at: Date;
}

// Driver Profile Interface
export interface DriverProfile {
  id: string;
  user_id: string;
  license_number: string;
  license_expiry: Date;
  rating: number;
  total_rides: number;
  cancellation_count: number;
  host_no_show_count: number;
  created_at: Date;
}

// Vehicle Interface
export interface Vehicle {
  id: string;
  driver_id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  plate_number: string;
  total_seats: number;
  vehicle_type: "car" | "bike";
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Ride Interface
export interface Ride {
  id: string;
  driver_id: string;
  vehicle_id: string;
  origin_address: string;
  destination_address: string;
  scheduled_at: Date;
  seats_total: number;
  seats_available: number;
  price_per_seat: number;
  status: RideStatus;
  started_at: Date | null;
  completed_at: Date | null;
  cancelled_reason: string | null;
  created_at: Date;
  updated_at: Date;
}

// Booking Interface
export interface Booking {
  id: string;
  ride_id: string;
  rider_id: string;
  seats_booked: number;
  total_amount: number;
  status: BookingStatus;
  expires_at: Date | null;
  confirmed_at: Date | null;
  paid_at: Date | null;
  no_show_reported_at: Date | null;
  payment_attempts: number;
  last_payment_attempt_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

// Payment Interface
export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  currency: string;
  provider: string;
  provider_ref: string | null;
  status: PaymentStatus;
  attempt_number: number;
  failure_reason: string | null;
  refunded_at: Date | null;
  created_at: Date;
}

// Review Interface
export interface Review {
  id: string;
  ride_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string | null;
  created_at: Date;
}

// Status Enums
export type RideStatus =
  | "scheduled"
  | "open"
  | "in_progress"
  | "completed"
  | "cancelled";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "paid"
  | "cancelled"
  | "no_seat"
  | "no_show";

export type PaymentStatus = "pending" | "success" | "failed" | "refunded";

export type VehicleType = "car" | "bike";
export type ActiveMode = "rider" | "driver";
export type VerificationType = "aadhaar" | "pan" | "license" | "rc";
export type VerificationStatus =
  | "pending"
  | "submitted"
  | "verified"
  | "rejected";

// Input Types
// ─── Input Types ───────────────────────────────────────────
export interface UpdateProfileInput {
  full_name?: string;
  email?: string;
  avatar_url?: string;
}

export interface SwitchModeInput {
  mode: "rider" | "driver";
}

export interface AddVehicleInput {
  make: string;
  model: string;
  year: number;
  color: string;
  plate_number: string;
  total_seats: number;
  vehicle_type: "car" | "bike";
}

export interface CreateRideInput {
  vehicle_id: string;
  origin_address: string;
  origin_lat: number;
  origin_lng: number;
  destination_address: string;
  destination_lat: number;
  destination_lng: number;
  scheduled_at: string; // ISO datetime string
  seats_total: number;
  price_per_seat: number;
}

export interface SearchRidesInput {
  // Rider's origin
  origin_lat: number;
  origin_lng: number;
  // Rider's destination
  destination_lat: number;
  destination_lng: number;
  // Search corridor radius (default 5km)
  radius_m?: number;
  // Optional date filter
  scheduled_date?: string;
}

export interface UpdateRideStatusInput {
  status: "in_progress" | "completed" | "cancelled";
  cancelled_reason?: string;
}

export interface RequestBookingInput {
  ride_id: string;
  seats_booked: number;
  // rider's specific pickup and dropoff within the ride's corridor
  hop_in_address: string;
  hop_in_lat: number;
  hop_in_lng: number;
  hop_off_address: string;
  hop_off_lat: number;
  hop_off_lng: number;
}

export interface CancelBookingInput {
  reason?: string;
}

// ─── Response DTOs ─────────────────────────────────────────
// Subset of internal types — only what clients need

export interface UserResponse {
  id: string;
  phone: string;
  email: string | null;
  full_name: string;
  avatar_url: string | null;
  is_verified: boolean;
  is_driver_approved: boolean;
  active_mode: ActiveMode;
}

export interface VehicleResponse {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  plate_number: string;
  total_seats: number;
  vehicle_type: VehicleType;
  is_active: boolean;
}

export interface RideResponse {
  id: string;
  origin_address: string;
  destination_address: string;
  scheduled_at: Date;
  seats_total: number;
  seats_available: number;
  price_per_seat: number;
  status: RideStatus;
}

export interface BookingResponse {
  id: string;
  status: BookingStatus;
  seats_booked: number;
  total_amount: number;
  confirmed_at: Date | null;
  paid_at: Date | null;
  created_at: Date;
  ride: {
    id: string;
    origin_address: string;
    destination_address: string;
    scheduled_at: Date;
    price_per_seat: number;
    status: RideStatus;
  };
  hop_in_address: string | null;
  hop_off_address: string | null;
  rider: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    phone: string;
  };
}

export interface RideDetailResponse {
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
    id: string;
    full_name: string;
    avatar_url: string | null;
    rating: number;
    total_rides: number;
  };
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: number;
    color: string;
    plate_number: string;
    vehicle_type: string;
    total_seats: number;
  };
}
