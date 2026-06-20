import {
  Booking,
  BookingResponse,
  CancelBookingInput,
  RequestBookingInput,
} from "@route-mate/shared";
import { PoolClient } from "pg";
import {
  withTransaction,
  queryOne,
  query,
} from "../../infrastructure/db/client";
import {
  bookingQueue,
  refundQueue,
} from "../../infrastructure/queue/bookingQueue";
import {
  AppError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../../utils/errors";
import { BookingRow, formatBooking } from "../../utils/formatters";
import {
  notifyBookingRequested,
  notifyBookingConfirmed,
  notifyBookingCancelled,
  notifyNoSeat,
  notifyAdminNewBooking,
} from "../../infrastructure/socket/notifications.js";

// ─── Internal row types ────────────────────────────────────
// Never exported — DB implementation details only

// ─── Reusable booking SELECT ───────────────────────────────
// Single query shape used by all methods that return BookingResponse
// Keeps JOIN logic in one place — change it here, everything updates
const BOOKING_SELECT = `
  SELECT
    b.id,
    b.ride_id,
    b.rider_id,
    b.seats_booked,
    b.total_amount,
    b.status,
    b.confirmed_at,
    b.paid_at,
    b.no_show_reported_at,
    b.hop_in_address,
    b.hop_off_address,
    b.created_at,
    b.updated_at,
    -- ride snapshot
    r.origin_address    AS ride_origin_address,
    r.destination_address AS ride_destination_address,
    r.scheduled_at      AS ride_scheduled_at,
    r.price_per_seat    AS ride_price_per_seat,
    r.status            AS ride_status,
    -- rider info (driver needs this)
    u.full_name         AS rider_full_name,
    u.avatar_url        AS rider_avatar_url,
    u.phone             AS rider_phone
  FROM bookings b
  JOIN rides r  ON r.id = b.ride_id
  JOIN users u  ON u.id = b.rider_id
`;

export class BookingsService {
  // ─────────────────────────────────────────────────────────
  // requestBooking
  // Called by: rider
  // Creates a pending booking, notifies driver
  // Seat NOT decremented here — only on payment
  // ─────────────────────────────────────────────────────────
  async requestBooking(
    riderId: string,
    input: RequestBookingInput,
  ): Promise<BookingResponse> {
    // 1. fetch ride — must be open
    const ride = await queryOne<{
      id: string;
      status: string;
      seats_available: number;
      price_per_seat: string;
      driver_id: string; // driver_profiles.id
      driver_user_id: string; // users.id — for notification
    }>(
      `SELECT
        r.id,
        r.status,
        r.seats_available,
        r.price_per_seat,
        r.driver_id,
        dp.user_id AS driver_user_id
      FROM rides r
      JOIN driver_profiles dp ON dp.id = r.driver_id
      WHERE r.id = $1`,
      [input.ride_id],
    );

    if (!ride) throw new NotFoundError("Ride not found.");

    if (ride.status !== "open") {
      throw new AppError(
        `Ride is ${ride.status} and not accepting bookings.`,
        400,
      );
    }

    // 2. check seats — soft check only
    // Hard guard is at payment time. This prevents obviously hopeless requests
    // e.g. ride has 1 seat, rider requests 3
    if (ride.seats_available < input.seats_booked) {
      throw new AppError(
        `Only ${ride.seats_available} seat(s) available.`,
        400,
      );
    }

    // 3. prevent rider from booking their own ride
    // driver_user_id is the users.id of the driver
    if (ride.driver_user_id === riderId) {
      throw new AppError("You cannot book your own ride.", 400);
    }

    // 4. prevent duplicate booking — DB has UNIQUE(ride_id, rider_id)
    // but we catch it here for a clean error message
    const existing = await queryOne<{ id: string; status: string }>(
      `SELECT id, status FROM bookings
      WHERE ride_id = $1 AND rider_id = $2`,
      [input.ride_id, riderId],
    );

    if (existing) {
      if (existing.status === "cancelled" || existing.status === "no_seat") {
        // allow re-booking if previous was cancelled or lost seat race
        // do nothing here — fall through to INSERT
      } else {
        throw new ConflictError("You already have a booking for this ride.");
      }
    }

    // 5. calculate total amount
    const pricePerSeat = parseFloat(ride.price_per_seat);
    const totalAmount = pricePerSeat * input.seats_booked;

    // 6. create booking
    // Note: UNIQUE(ride_id, rider_id) means if rider had a previous
    // cancelled/no_seat booking we need to handle the conflict
    // We use INSERT ... ON CONFLICT to upsert cleanly
    const booking = await queryOne<BookingRow>(
      `INSERT INTO bookings (
        ride_id, rider_id, seats_booked, total_amount,
        hop_in_address, hop_in_location,
        hop_off_address, hop_off_location
      ) VALUES (
        $1, $2, $3, $4,
        $5, ST_MakePoint($6, $7)::geography,
        $8, ST_MakePoint($9, $10)::geography
      )
      ON CONFLICT (ride_id, rider_id) DO UPDATE SET
        seats_booked  = EXCLUDED.seats_booked,
        total_amount  = EXCLUDED.total_amount,
        status        = 'pending',
        hop_in_address   = EXCLUDED.hop_in_address,
        hop_in_location  = EXCLUDED.hop_in_location,
        hop_off_address  = EXCLUDED.hop_off_address,
        hop_off_location = EXCLUDED.hop_off_location,
        confirmed_at  = NULL,
        paid_at       = NULL,
        updated_at    = NOW()
      RETURNING
        id, ride_id, rider_id, seats_booked, total_amount,
        status, confirmed_at, paid_at, no_show_reported_at,
        hop_in_address, hop_off_address, created_at, updated_at`,
      [
        input.ride_id,
        riderId,
        input.seats_booked,
        totalAmount,
        input.hop_in_address,
        input.hop_in_lng,
        input.hop_in_lat,
        input.hop_off_address,
        input.hop_off_lng,
        input.hop_off_lat,
      ],
    );

    if (!booking) throw new AppError("Failed to create booking.");

    // fetch rider name for notification
    const rider = await queryOne<{ full_name: string }>(
      `SELECT full_name FROM users WHERE id = $1`,
      [riderId],
    );

    // emit immediately via socket (user is online)
    notifyBookingRequested({
      driverUserId: ride.driver_user_id,
      bookingId: booking.id,
      rideId: input.ride_id,
      riderName: rider?.full_name ?? "A rider",
      seatsBooked: input.seats_booked,
      hopInAddress: input.hop_in_address,
    });

    // enqueue as backup for offline delivery and analytics
    await bookingQueue.add("booking.requested", {
      bookingId: booking.id,
      rideId: input.ride_id,
      riderId,
      driverId: ride.driver_user_id,
    });

    // notify admins
    notifyAdminNewBooking({
      rideId: input.ride_id,
      riderName: rider?.full_name ?? "A rider",
      amount: totalAmount,
    });

    // 8. fetch full booking with JOINs for response
    return this.getBookingById(booking.id);
  }

  // ─────────────────────────────────────────────────────────
  // confirmBooking
  // Called by: driver
  // Verifies driver owns the ride, transitions pending → confirmed
  // Does NOT touch seats — that happens at payment
  // ─────────────────────────────────────────────────────────
  async confirmBooking(
    driverUserId: string,
    bookingId: string,
  ): Promise<BookingResponse> {
    // 1. fetch booking + verify driver owns the ride in one query
    const booking = await queryOne<{
      id: string;
      status: string;
      rider_id: string;
      ride_id: string;
    }>(
      `SELECT
        b.id,
        b.status,
        b.rider_id,
        b.ride_id
      FROM bookings b
      JOIN rides r        ON r.id  = b.ride_id
      JOIN driver_profiles dp ON dp.id = r.driver_id
      WHERE b.id = $1
      AND dp.user_id = $2`,
      [bookingId, driverUserId],
    );

    // null = booking doesn't exist OR driver doesn't own the ride
    // same error — don't leak info
    if (!booking) throw new NotFoundError("Booking not found.");

    if (booking.status !== "pending") {
      throw new AppError(
        `Booking is already ${booking.status} and cannot be confirmed.`,
        400,
      );
    }

    // 2. confirm — simple status update, no seat changes
    const updated = await queryOne<{ id: string }>(
      `UPDATE bookings SET
        status       = 'confirmed',
        confirmed_at = NOW(),
        updated_at   = NOW()
      WHERE id = $1
      RETURNING id`,
      [bookingId],
    );

    if (!updated) throw new AppError("Failed to confirm booking.");

    notifyBookingConfirmed({
      riderUserId: booking.rider_id,
      bookingId,
      rideId: booking.ride_id,
    });

    // 3. notify rider — payment is now open
    await bookingQueue.add("booking.confirmed", {
      bookingId,
      riderId: booking.rider_id,
      rideId: booking.ride_id,
    });

    return this.getBookingById(bookingId);
  }

  // ─────────────────────────────────────────────────────────
  // cancelBooking
  // Called by: rider (any non-paid status) OR driver (any status)
  // If paid booking cancelled → enqueue refund job (Phase 4)
  // If confirmed booking cancelled → no seat to release (not decremented yet)
  // ─────────────────────────────────────────────────────────
  async cancelBooking(
    userId: string,
    bookingId: string,
    input: CancelBookingInput,
  ): Promise<BookingResponse> {
    // 1. fetch booking with enough context to check permissions
    const booking = await queryOne<{
      id: string;
      status: string;
      rider_id: string;
      ride_id: string;
      seats_booked: number;
      driver_user_id: string;
    }>(
      `SELECT
        b.id,
        b.status,
        b.rider_id,
        b.ride_id,
        b.seats_booked,
        dp.user_id AS driver_user_id
      FROM bookings b
      JOIN rides r        ON r.id  = b.ride_id
      JOIN driver_profiles dp ON dp.id = r.driver_id
      WHERE b.id = $1`,
      [bookingId],
    );

    if (!booking) throw new NotFoundError("Booking not found.");

    // 2. permission check
    // rider can cancel their own booking
    // driver can cancel any booking on their ride
    const isRider = booking.rider_id === userId;
    const isDriver = booking.driver_user_id === userId;

    if (!isRider && !isDriver) {
      throw new UnauthorizedError("You cannot cancel this booking.");
    }

    // 3. terminal state check
    const terminalStates = ["cancelled", "no_seat", "no_show"];
    if (terminalStates.includes(booking.status)) {
      throw new AppError(`Booking is already ${booking.status}.`, 400);
    }

    // 4. if paid → need to release seat + enqueue refund
    // if confirmed → just cancel, no seat to release
    if (booking.status === "paid") {
      await withTransaction(async (client: PoolClient) => {
        // release the seat back
        await client.query(
          `UPDATE rides SET
            seats_available = seats_available + $1,
            updated_at      = NOW()
          WHERE id = $2`,
          [booking.seats_booked, booking.ride_id],
        );

        // cancel the booking
        await client.query(
          `UPDATE bookings SET
            status     = 'cancelled',
            updated_at = NOW()
          WHERE id = $1`,
          [bookingId],
        );
      });

      // notify the other party
      const notifyUserId = isRider ? booking.driver_user_id : booking.rider_id;
      notifyBookingCancelled({
        userId: notifyUserId,
        bookingId,
        rideId: booking.ride_id,
      });

      // enqueue refund job — processed by refund.worker.ts
      await bookingQueue.add("booking.cancelled", {
        bookingId,
        rideId: booking.ride_id,
        riderId: booking.rider_id,
      });

      await refundQueue.add("process.refund", {
        bookingId,
        rideId: booking.ride_id,
        riderId: booking.rider_id,
      });
    } else {
      // pending or confirmed — simple cancel, no seat involved
      await queryOne<{ id: string }>(
        `UPDATE bookings SET
          status     = 'cancelled',
          updated_at = NOW()
        WHERE id = $1
        RETURNING id`,
        [bookingId],
      );
    }

    return this.getBookingById(bookingId);
  }

  // ─────────────────────────────────────────────────────────
  // markNoSeat
  // Called by: payment service (Phase 3) when seat guard fails
  // Not a public endpoint — internal service method
  // Rider lost the seat race at payment time
  // ─────────────────────────────────────────────────────────
  async markNoSeat(bookingId: string): Promise<void> {
    const booking = await queryOne<{ id: string; rider_id: string }>(
      `UPDATE bookings SET
        status     = 'no_seat',
        updated_at = NOW()
      WHERE id = $1
      RETURNING id, rider_id`,
      [bookingId],
    );

    if (!booking) throw new NotFoundError("Booking not found.");

    // notify rider their seat was taken
    await bookingQueue.add("booking.no_seat", {
      bookingId,
      riderId: booking.rider_id,
    });
  }

  // ─────────────────────────────────────────────────────────
  // markPaid
  // Called by: payment service (Phase 3) after successful payment
  // This is where seat gets decremented — atomic with booking update
  // ─────────────────────────────────────────────────────────
  async markPaid(
    bookingId: string,
    seatsBooked: number,
    rideId: string,
  ): Promise<BookingResponse> {
    await withTransaction(async (client: PoolClient) => {
      // 1. decrement seats with guard — this is the critical race condition check
      const rideResult = await client.query(
        `UPDATE rides SET
          seats_available = seats_available - $1,
          updated_at      = NOW()
        WHERE id = $2
        AND seats_available >= $1   -- guard: ensures no overbooking
        RETURNING id`,
        [seatsBooked, rideId],
      );

      // guard failed — no seats left, someone else got there first
      if (rideResult.rowCount === 0) {
        // mark booking as no_seat inside same transaction
        await client.query(
          `UPDATE bookings SET
            status     = 'no_seat',
            updated_at = NOW()
          WHERE id = $1`,
          [bookingId],
        );
        // throw to trigger rollback and surface the error to payment service
        throw new AppError("NO_SEAT", 409);
      }

      // 2. seats decremented — now mark booking as paid
      await client.query(
        `UPDATE bookings SET
          status     = 'paid',
          paid_at    = NOW(),
          updated_at = NOW()
        WHERE id = $1`,
        [bookingId],
      );
    });

    return this.getBookingById(bookingId);
  }

  // ─────────────────────────────────────────────────────────
  // getMyBookings
  // Called by: rider
  // Returns all bookings for the current rider, newest first
  // ─────────────────────────────────────────────────────────
  async getMyBookings(riderId: string): Promise<BookingResponse[]> {
    const rows = await query<BookingRow>(
      `${BOOKING_SELECT}
      WHERE b.rider_id = $1
      ORDER BY b.created_at DESC`,
      [riderId],
    );

    return rows.map(formatBooking);
  }

  // ─────────────────────────────────────────────────────────
  // getRideBookings
  // Called by: driver
  // Returns all bookings on a specific ride the driver owns
  // ─────────────────────────────────────────────────────────
  async getRideBookings(
    driverUserId: string,
    rideId: string,
  ): Promise<BookingResponse[]> {
    // verify driver owns this ride before returning booking data
    const ride = await queryOne<{ id: string }>(
      `SELECT r.id FROM rides r
      JOIN driver_profiles dp ON dp.id = r.driver_id
      WHERE r.id = $1 AND dp.user_id = $2`,
      [rideId, driverUserId],
    );

    if (!ride) throw new NotFoundError("Ride not found.");

    const rows = await query<BookingRow>(
      `${BOOKING_SELECT}
      WHERE b.ride_id = $1
      ORDER BY b.created_at ASC`,
      [rideId],
    );

    return rows.map(formatBooking);
  }

  // ─────────────────────────────────────────────────────────
  // getBookingById
  // Internal method — used by other service methods to fetch
  // full booking with JOINs after mutations
  // Not exposed as a public endpoint
  // ─────────────────────────────────────────────────────────
  async getBookingById(bookingId: string): Promise<BookingResponse> {
    const row = await queryOne<BookingRow>(
      `${BOOKING_SELECT}
      WHERE b.id = $1`,
      [bookingId],
    );

    if (!row) throw new NotFoundError("Booking not found.");

    return formatBooking(row);
  }
}

export const bookingsService = new BookingsService();
