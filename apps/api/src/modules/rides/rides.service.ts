import {
  CreateRideInput,
  DriverProfile,
  Ride,
  RideDetailResponse,
  RideResponse,
  SearchRidesInput,
  SnapToRouteInput,
  UpdateRideStatusInput,
} from "@route-mate/shared";
import { query, queryOne } from "../../infrastructure/db/client";
import { AppError, NotFoundError } from "../../utils/errors";
import { formatRide, formatRideDetail } from "../../utils/formatters";
import { notifyRideStatusChanged } from "../../infrastructure/socket/notifications.js";
import { SnapToRouteResponse } from "@route-mate/shared";
import { getRoutePolyline } from "../../utils/routing";

export interface RideDetailRow {
  // ride fields
  id: string;
  origin_address: string;
  destination_address: string;
  scheduled_at: Date;
  seats_total: number;
  seats_available: number;
  price_per_seat: string; // pg returns NUMERIC as string
  status: string;
  created_at: Date;
  updated_at: Date;
  // driver fields (from users via driver_profiles)
  driver_user_id: string;
  driver_name: string;
  driver_avatar: string | null;
  driver_rating: string; // pg returns NUMERIC(3,2) as string
  driver_total_rides: number;
  // vehicle fields
  vehicle_id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  plate_number: string;
  vehicle_type: string;
  total_seats: number;
  route_geojson: {
    type: string;
    coordinates: [number, number][]; // [lng, lat] pairs
  } | null;
}
export class RidesService {
  /**
   * create ride
   */
  async createRide(
    userId: string,
    input: CreateRideInput,
  ): Promise<RideResponse> {
    const profile = await queryOne<{ id: string }>(
      `SELECT id FROM driver_profiles WHERE user_id = $1`,
      [userId],
    );
    if (!profile) {
      throw new NotFoundError(
        "Driver profile not found. Complete driver onboarding first.",
      );
    }

    const vehicle = await queryOne<{ id: string }>(
      `SELECT id FROM vehicles WHERE id = $1 AND driver_id = $2 AND is_active = True`,
      [input.vehicle_id, profile.id],
    );
    if (!vehicle) {
      throw new NotFoundError("Vehicle not found or not active.");
    }

    // fetch real road route from Google Directions
    const routePoints = await getRoutePolyline(
      input.origin_lat,
      input.origin_lng,
      input.destination_lat,
      input.destination_lng,
    );

    // build PostGIS ST_MakeLine from all route points
    // format: LINESTRING(lng lat, lng lat, ...)
    const linestring = routePoints
      .map(([lng, lat]) => `${lng} ${lat}`)
      .join(",");

    const ride = await queryOne<Ride>(
      `INSERT INTO rides (
      driver_id, vehicle_id,
      origin_address, origin_location,
      destination_address, destination_location,
      route_line,
      scheduled_at, seats_total, seats_available, price_per_seat
    )
    VALUES (
      $1, $2, $3,
      ST_MakePoint($4, $5)::geography,
      $6,
      ST_MakePoint($7, $8)::geography,
      ST_GeomFromText($9, 4326)::geography,
      $10, $11, $11, $12
    )
    RETURNING
      id, driver_id, vehicle_id, origin_address,
      destination_address, scheduled_at, seats_total,
      seats_available, price_per_seat, status,
      created_at, updated_at`,
      [
        profile.id,
        input.vehicle_id,
        input.origin_address,
        input.origin_lng,
        input.origin_lat,
        input.destination_address,
        input.destination_lng,
        input.destination_lat,
        `LINESTRING(${linestring})`, // $9 — real road geometry
        input.scheduled_at,
        input.seats_total,
        input.price_per_seat,
      ],
    );

    if (!ride) throw new AppError("Failed to create ride");
    return formatRide(ride);
  }

  /**
   * search rides
   */
  async searchRides(input: SearchRidesInput): Promise<RideResponse[]> {
    const radius = input.radius_m ?? 5000;
    const rides = await query<Ride>(
      `SELECT
      id, driver_id, vehicle_id,
      origin_address, destination_address,
      scheduled_at, seats_total, seats_available,
      price_per_seat, status, created_at,
      ST_Distance(
        origin_location,
        ST_MakePoint($1, $2)::geography
      ) AS distance_m
    FROM rides
    WHERE status = 'open'
      AND scheduled_at > NOW()
      AND seats_available > 0
      AND ST_DWithin(route_line, ST_MakePoint($1, $2)::geography, $5)
      AND ST_DWithin(route_line, ST_MakePoint($3, $4)::geography, $5)
      AND ST_LineLocatePoint(
        route_line::geometry,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)
      ) < ST_LineLocatePoint(
        route_line::geometry,
        ST_SetSRID(ST_MakePoint($3, $4), 4326)
      )
    ORDER BY distance_m ASC
    LIMIT 20`,
      [
        input.origin_lng,
        input.origin_lat,
        input.destination_lng,
        input.destination_lat,
        radius,
      ],
    );

    return rides.map(formatRide);
  }

  /**
   * get ride by id
   */
  async getRideById(rideId: string): Promise<RideDetailResponse> {
    const row = await queryOne<RideDetailRow>(
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
      r.updated_at,
      -- driver info (two hops: driver_profiles → users)
      u.id          AS driver_user_id,
      u.full_name   AS driver_name,
      u.avatar_url  AS driver_avatar,
      dp.rating     AS driver_rating,
      dp.total_rides AS driver_total_rides,
      -- vehicle info
      v.id          AS vehicle_id,
      v.make,
      v.model,
      v.year,
      v.color,
      v.plate_number,
      v.vehicle_type,
      v.total_seats,
      ST_AsGeoJSON(r.route_line)::json AS route_geojson
    FROM rides r
    JOIN driver_profiles dp ON dp.id = r.driver_id
    JOIN users u            ON u.id  = dp.user_id
    JOIN vehicles v         ON v.id  = r.vehicle_id
    WHERE r.id = $1`,
      [rideId],
    );

    if (!row) throw new NotFoundError("Ride not found.");

    return formatRideDetail(row);
  }

  /**
   * update ride status
   */
  async updateRideStatus(
    userId: string,
    rideId: string,
    input: UpdateRideStatusInput,
  ): Promise<RideDetailResponse> {
    // 1. fetch current ride + verify ownership in one query
    const ride = await queryOne<{
      id: string;
      status: string;
      driver_profile_id: string;
    }>(
      `SELECT
      r.id,
      r.status,
      dp.id   AS driver_profile_id
    FROM rides r
    JOIN driver_profiles dp ON dp.id = r.driver_id
    WHERE r.id = $1
    AND dp.user_id = $2`,
      [rideId, userId],
    );

    if (!ride) throw new NotFoundError("Ride not found.");

    // 2. status machine — define valid transitions
    const validTransitions: Record<string, string[]> = {
      open: ["in_progress", "cancelled"],
      in_progress: ["completed", "cancelled"],
    };

    const allowed = validTransitions[ride.status];

    // current status has no valid transitions (completed / cancelled / scheduled)
    if (!allowed) {
      throw new AppError(
        `Ride is already ${ride.status} and cannot be updated.`,
        400,
      );
    }

    // requested transition is not valid from current status
    if (!allowed.includes(input.status)) {
      throw new AppError(
        `Cannot transition ride from '${ride.status}' to '${input.status}'.`,
        400,
      );
    }

    // 3. extra guard: cancelling requires no paid bookings
    // (refund job will be a BullMQ concern later — for now we block hard)
    if (input.status === "cancelled") {
      const paidBooking = await queryOne<{ id: string }>(
        `SELECT id FROM bookings
      WHERE ride_id = $1
      AND status = 'paid'
      LIMIT 1`,
        [rideId],
      );

      if (paidBooking) {
        /**
         * TODO: add refund flow if paid bookings
         */
        throw new AppError(
          "Cannot cancel ride with paid bookings. Refund flow not yet implemented.",
          400,
        );
      }
    }

    // 4. build dynamic SET clause — only set cancelled_reason if provided
    const now = new Date();
    const updatedRide = await queryOne<{ id: string }>(
      `UPDATE rides SET
    status            = $1::text,
    cancelled_reason  = CASE WHEN $1::text = 'cancelled'
                          THEN $2
                          ELSE cancelled_reason
                        END,
    started_at        = CASE WHEN $1::text = 'in_progress'
                          THEN $3
                          ELSE started_at
                        END,
    completed_at      = CASE WHEN $1::text = 'completed'
                          THEN $3
                          ELSE completed_at
                        END,
    updated_at        = $3
  WHERE id = $4
  RETURNING id`,
      [input.status, input.cancelled_reason ?? null, now, rideId],
    );

    if (!updatedRide) throw new AppError("Failed to update ride status.");

    // notify all paid riders of status change
    const paidRiders = await query<{ rider_id: string }>(
      `SELECT rider_id FROM bookings
  WHERE ride_id = $1 AND status = 'paid'`,
      [rideId],
    );

    paidRiders.forEach((r) => {
      notifyRideStatusChanged({
        riderUserId: r.rider_id,
        rideId,
        status: input.status,
      });
    });

    // 5. return full detail — reuse getRideById, no query duplication
    return this.getRideById(rideId);
  }

  /**
   * cancel ride
   */
  async cancelRide(
    userId: string,
    rideId: string,
    reason?: string,
  ): Promise<RideDetailResponse> {
    return this.updateRideStatus(userId, rideId, {
      status: "cancelled",
      cancelled_reason: reason,
    });
  }

  /**
   * snapToRoute
   * Given a tap coordinate, find the nearest point on the ride's route_line
   * Used by riders selecting hop-in/hop-off points — ensures the selected
   * point is actually on the driver's path, not an arbitrary location
   */
  async snapToRoute(input: SnapToRouteInput): Promise<SnapToRouteResponse> {
    const result = await queryOne<{
      snapped_lat: number;
      snapped_lng: number;
      fraction_along_route: number;
    }>(
      `SELECT
    ST_Y(snapped_point::geometry) AS snapped_lat,
    ST_X(snapped_point::geometry) AS snapped_lng,
    ST_LineLocatePoint(
      route_line::geometry,
      snapped_point::geometry
    ) AS fraction_along_route
  FROM (
    SELECT
      ST_ClosestPoint(
        route_line::geometry,
        ST_SetSRID(ST_MakePoint($2, $3), 4326)
      )::geography AS snapped_point,
      route_line
    FROM rides
    WHERE id = $1
  ) sub`,
      [input.ride_id, input.lng, input.lat],
    );

    if (!result) throw new NotFoundError("Ride not found or has no route.");

    return {
      snapped_lat: result.snapped_lat,
      snapped_lng: result.snapped_lng,
      fraction_along_route: result.fraction_along_route,
    };
  }

  async getMyRides(userId: string): Promise<RideResponse[]> {
    const rides = await query<Ride>(
      `SELECT r.id, r.driver_id, r.vehicle_id,
      r.origin_address, r.destination_address,
      r.scheduled_at, r.seats_total, r.seats_available,
      r.price_per_seat, r.status, r.created_at, r.updated_at
    FROM rides r
    JOIN driver_profiles dp ON dp.id = r.driver_id
    WHERE dp.user_id = $1
    ORDER BY r.scheduled_at DESC`,
      [userId],
    );
    return rides.map(formatRide);
  }
}

export const ridesService = new RidesService();
