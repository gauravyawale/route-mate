import type {
  User,
  UserResponse,
  Vehicle,
  VehicleResponse,
} from "@route-mate/shared";

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
