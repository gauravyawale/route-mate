import type {
  AddVehicleInput,
  Vehicle,
  VehicleResponse,
} from "@route-mate/shared";
import { query, queryOne } from "../../infrastructure/db/client.js";
import { AppError, NotFoundError } from "../../utils/errors.js";
import { formatVehicle } from "../../utils/formatters.js";

export class VehiclesService {
  async getMyVehicles(userId: string): Promise<VehicleResponse[]> {
    const vehicles = await query<Vehicle>(
      `SELECT v.id, v.make, v.model,
              v.year, v.color, v.plate_number,
              v.total_seats, v.vehicle_type, v.is_active
       FROM users u
       JOIN driver_profiles dp ON u.id = dp.user_id
       JOIN vehicles v ON dp.id = v.driver_id
       WHERE u.id = $1
       AND v.is_active = TRUE`,
      [userId],
    );

    return vehicles.map(formatVehicle);
  }

  async addVehicle(
    userId: string,
    input: AddVehicleInput,
  ): Promise<VehicleResponse> {
    // Step 1 — find driver_profile for this user
    const profile = await queryOne<{ id: string }>(
      `SELECT id FROM driver_profiles WHERE user_id = $1`,
      [userId],
    );

    if (!profile) {
      throw new NotFoundError(
        "Driver profile not found. Complete driver onboarding first.",
      );
    }

    // Step 2 — bike seat constraint (belt and suspenders over DB constraint)
    if (input.vehicle_type === "bike" && input.total_seats !== 1) {
      throw new AppError("Bikes can only have 1 seat.", 400, "INVALID_VEHICLE");
    }

    // Step 3 — insert vehicle
    const vehicle = await queryOne<Vehicle>(
      `INSERT INTO vehicles
        (driver_id, make, model, year, color, plate_number, total_seats, vehicle_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        profile.id,
        input.make,
        input.model,
        input.year,
        input.color,
        input.plate_number,
        input.total_seats,
        input.vehicle_type,
      ],
    );

    if (!vehicle) throw new AppError("Failed to add vehicle");

    return formatVehicle(vehicle);
  }

  async setVehicleActive(
    userId: string,
    vehicleId: string,
    isActive: boolean,
  ): Promise<VehicleResponse> {
    // Ownership check — vehicle must belong to this user
    const owned = await queryOne<{ id: string }>(
      `SELECT v.id FROM vehicles v
       JOIN driver_profiles dp ON dp.id = v.driver_id
       WHERE v.id = $1 AND dp.user_id = $2`,
      [vehicleId, userId],
    );

    if (!owned) {
      throw new NotFoundError("Vehicle not found");
    }

    const vehicle = await queryOne<Vehicle>(
      `UPDATE vehicles
       SET is_active = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [isActive, vehicleId],
    );

    if (!vehicle) throw new NotFoundError("Vehicle not found");

    return formatVehicle(vehicle);
  }
}

export const vehiclesService = new VehiclesService();
