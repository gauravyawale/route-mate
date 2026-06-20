import crypto from "crypto";
import {
  CreatePaymentOrderInput,
  PaymentResponse,
  VerifyPaymentInput,
} from "@route-mate/shared";
import { queryOne, withTransaction } from "../../infrastructure/db/client";
import { razorpay } from "../../infrastructure/razorpay/client";
import { bookingsService } from "../bookings/bookings.service";
import { config } from "../../config/index.js";
import { AppError, NotFoundError, UnauthorizedError } from "../../utils/errors";
import {
  notifyPaymentCompleted,
  notifyNoSeat,
  notifyAdminPaymentCompleted,
} from "../../infrastructure/socket/notifications.js";

interface PaymentRow {
  id: string;
  booking_id: string;
  amount: string; // pg returns NUMERIC as string
  currency: string;
  status: string;
  provider: string;
  provider_ref: string | null;
  attempt_number: number;
  failure_reason: string | null;
  refunded_at: Date | null;
  created_at: Date;
}

interface BookingForPayment {
  id: string;
  status: string;
  rider_id: string;
  ride_id: string;
  seats_booked: number;
  total_amount: string;
  razorpay_order_id: string | null; // stored in provider_ref on pending payment
}

export class PaymentsService {
  /**
   * createOrder
   * Called by: rider after booking is confirmed by driver
   * Creates a Razorpay order + payment record in DB
   * Returns order details so client can open Razorpay payment UI
   */
  async createOrder(
    riderId: string,
    input: CreatePaymentOrderInput,
  ): Promise<PaymentResponse> {
    // fetch booking — must be confirmed and owned by this rider
    const booking = await queryOne<BookingForPayment>(
      `SELECT
        b.id,
        b.status,
        b.rider_id,
        b.ride_id,
        b.seats_booked,
        b.total_amount,
        p.provider_ref AS razorpay_order_id
      FROM bookings b
      LEFT JOIN payments p ON p.booking_id = b.id
        AND p.status = 'pending'
        AND p.provider = 'razorpay'
      WHERE b.id = $1`,
      [input.booking_id],
    );

    if (!booking) throw new NotFoundError("Booking not found.");

    if (booking.rider_id !== riderId) {
      throw new UnauthorizedError("This booking does not belong to you.");
    }

    if (booking.status !== "confirmed") {
      throw new AppError(
        `Booking is ${booking.status}. Only confirmed bookings can be paid.`,
        400,
      );
    }

    // check attempt count — max 3 per booking
    const attemptCount = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count
      FROM payments
      WHERE booking_id = $1`,
      [input.booking_id],
    );

    const attempts = parseInt(attemptCount?.count ?? "0");

    if (attempts >= 3) {
      throw new AppError(
        "Maximum payment attempts (3) reached for this booking.",
        400,
      );
    }

    // if a pending order already exists, return it
    // rider may have closed the payment UI without paying — let them retry
    // same order, no new Razorpay order created
    if (booking.razorpay_order_id) {
      const existingPayment = await queryOne<PaymentRow>(
        `SELECT * FROM payments
        WHERE booking_id = $1
        AND status = 'pending'
        ORDER BY created_at DESC
        LIMIT 1`,
        [input.booking_id],
      );

      if (existingPayment) {
        return this.formatPayment(existingPayment, {
          id: booking.razorpay_order_id,
          amount: parseFloat(existingPayment.amount) * 100,
          currency: existingPayment.currency,
        });
      }
    }

    // create Razorpay order
    // amount must be in paise (INR * 100)
    const amountInPaise = Math.round(parseFloat(booking.total_amount) * 100);

    if (!Number.isFinite(amountInPaise) || amountInPaise <= 0) {
      throw new AppError(
        "Invalid booking amount. Cannot create payment for this booking.",
        400,
        "INVALID_PAYMENT_AMOUNT",
      );
    }

    let order;
    try {
      order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: `bk_${input.booking_id.replace(/-/g, "").slice(0, 32)}`,
        notes: {
          booking_id: input.booking_id,
          ride_id: booking.ride_id,
          rider_id: riderId,
        },
      });
    } catch (err) {
      throw new AppError(
        "Failed to create payment order with Razorpay. Please try again later.",
        502,
        "PAYMENT_PROVIDER_ERROR",
      );
    }

    let payment;
    try {
      payment = await queryOne<PaymentRow>(
        `INSERT INTO payments (
          booking_id, amount, currency,
          provider, provider_ref, status, attempt_number
        ) VALUES (
          $1, $2, $3, $4, $5, 'pending', $6
        ) RETURNING *`,
        [
          input.booking_id,
          booking.total_amount,
          "INR",
          "razorpay",
          order.id, // razorpay order_id
          attempts + 1,
        ],
      );
    } catch (err) {
      throw new AppError(
        "Failed to create payment record. Please try again later.",
        500,
        "PAYMENT_RECORD_CREATION_FAILED",
      );
    }

    if (!payment) {
      throw new AppError(
        "Failed to create payment record.",
        500,
        "PAYMENT_RECORD_CREATION_FAILED",
      );
    }

    // 6. return with order details so client can open Razorpay UI
    return this.formatPayment(payment, {
      id: order.id,
      amount: amountInPaise,
      currency: "INR",
    });
  }

  /**
   * verifyPayment
   * Called by: rider after completing payment in Razorpay UI
   * Verifies HMAC-SHA256 signature — this is the security boundary for confirming payment authenticity
   * On success → markPaid (seat guard fires here)
   * On seat race loss → markNoSeat
   */
  async verifyPayment(
    riderId: string,
    input: VerifyPaymentInput,
  ): Promise<PaymentResponse> {
    // verify booking ownership
    const booking = await queryOne<{
      id: string;
      status: string;
      rider_id: string;
      ride_id: string;
      seats_booked: number;
    }>(
      `SELECT id, status, rider_id, ride_id, seats_booked
      FROM bookings WHERE id = $1`,
      [input.booking_id],
    );

    if (!booking) throw new NotFoundError("Booking not found.");

    if (booking.rider_id !== riderId) {
      throw new UnauthorizedError("This booking does not belong to you.");
    }

    if (booking.status !== "confirmed") {
      throw new AppError(
        `Booking is ${booking.status} and cannot be verified.`,
        400,
      );
    }

    // verify Razorpay signature
    // Razorpay signs: order_id + "|" + payment_id with your key_secret
    // You recreate the signature and compare — if they match, payment is genuine
    const expectedSignature = crypto
      .createHmac("sha256", config.RAZORPAY_KEY_SECRET)
      .update(`${input.razorpay_order_id}|${input.razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== input.razorpay_signature) {
      // signature mismatch — mark payment as failed
      await queryOne(
        `UPDATE payments SET
          status         = 'failed',
          failure_reason = 'Invalid payment signature'
        WHERE provider_ref = $1
        AND booking_id    = $2
        AND status        = 'pending'
        RETURNING id`,
        [input.razorpay_order_id, input.booking_id],
      );

      throw new AppError(
        "Payment verification failed. Invalid signature.",
        400,
      );
    }

    // update payment record — provider_ref now becomes payment_id
    // order_id served its purpose, payment_id is the permanent reference
    const payment = await queryOne<PaymentRow>(
      `UPDATE payments SET
        status       = 'success',
        provider_ref = $1     -- razorpay_payment_id replaces order_id
      WHERE provider_ref = $2  -- match on order_id
      AND booking_id    = $3
      AND status        = 'pending'
      RETURNING *`,
      [input.razorpay_payment_id, input.razorpay_order_id, input.booking_id],
    );

    if (!payment) throw new AppError("Payment record not found.");

    // markPaid — seat guard fires here
    // if seats ran out between confirm and payment, this throws AppError("NO_SEAT")
    try {
      await bookingsService.markPaid(
        input.booking_id,
        booking.seats_booked,
        booking.ride_id,
      );
    } catch (err) {
      if (err instanceof AppError && err.message === "NO_SEAT") {
        // seat race lost — booking marked no_seat inside markPaid transaction
        // payment was already successful — flag for refund in Phase 4
        await queryOne(
          `UPDATE payments SET
            failure_reason = 'No seats available — refund pending'
          WHERE id = $1`,
          [payment.id],
        );

        await bookingsService.markNoSeat(input.booking_id);

        notifyNoSeat({
          riderUserId: booking.rider_id,
          bookingId: input.booking_id,
        });

        throw new AppError(
          "Payment successful but no seats available. You will be refunded shortly.",
          409,
        );
      }
      throw err;
    }

    // fetch rider name and driver userId for notification
    const bookingDetail = await queryOne<{
      rider_name: string;
      driver_user_id: string;
      total_amount: string;
    }>(
      `SELECT
        u.full_name AS rider_name,
        du.id       AS driver_user_id,
        b.total_amount AS total_amount
        FROM bookings b
        JOIN users u  ON u.id  = b.rider_id
        JOIN rides r  ON r.id  = b.ride_id
        JOIN driver_profiles dp ON dp.id = r.driver_id
        JOIN users du ON du.id = dp.user_id
        WHERE b.id = $1`,
      [input.booking_id],
    );

    notifyPaymentCompleted({
      driverUserId: bookingDetail!.driver_user_id,
      bookingId: input.booking_id,
      rideId: booking.ride_id,
      riderName: bookingDetail!.rider_name,
      amount: parseFloat(bookingDetail!.total_amount),
    });

    notifyAdminPaymentCompleted({
      rideId: booking.ride_id,
      riderName: bookingDetail!.rider_name,
      amount: parseFloat(bookingDetail!.total_amount),
    });

    return this.formatPayment(payment);
  }

  /**
   
  * refundPayment
  * Called by: BullMQ refund worker (Phase 4)
  * NOT a public endpoint — internal service method
  */
  async refundPayment(bookingId: string): Promise<void> {
    const payment = await queryOne<PaymentRow>(
      `SELECT * FROM payments
      WHERE booking_id = $1
      AND status = 'success'
      ORDER BY created_at DESC
      LIMIT 1`,
      [bookingId],
    );

    if (!payment) {
      throw new NotFoundError("No successful payment found for this booking.");
    }

    // call Razorpay refund API
    await razorpay.payments.refund(payment.provider_ref!, {
      amount: Math.round(parseFloat(payment.amount) * 100), // paise
      notes: {
        reason: "Driver cancelled ride",
        booking_id: bookingId,
      },
    });

    // mark payment as refunded
    await queryOne(
      `UPDATE payments SET
        status      = 'refunded',
        refunded_at = NOW()
      WHERE id = $1
      RETURNING id`,
      [payment.id],
    );
  }

  /**
   *
   * getPaymentByBookingId
   * Called by: controller for GET /payments/:bookingId
   */
  async getPaymentByBookingId(
    riderId: string,
    bookingId: string,
  ): Promise<PaymentResponse> {
    const booking = await queryOne<{ rider_id: string }>(
      `SELECT rider_id FROM bookings WHERE id = $1`,
      [bookingId],
    );

    if (!booking) throw new NotFoundError("Booking not found.");

    if (booking.rider_id !== riderId) {
      throw new UnauthorizedError("This booking does not belong to you.");
    }

    const payment = await queryOne<PaymentRow>(
      `SELECT * FROM payments
      WHERE booking_id = $1
      ORDER BY created_at DESC
      LIMIT 1`,
      [bookingId],
    );

    if (!payment) throw new NotFoundError("No payment found for this booking.");

    return this.formatPayment(payment);
  }

  // formatPayment — internal formatter
  private formatPayment(
    row: PaymentRow,
    order?: { id: string; amount: number; currency: string },
  ): PaymentResponse {
    return {
      id: row.id,
      booking_id: row.booking_id,
      amount: parseFloat(row.amount),
      currency: row.currency,
      status: row.status as any,
      provider: row.provider,
      provider_ref: row.provider_ref,
      attempt_number: row.attempt_number,
      failure_reason: row.failure_reason,
      refunded_at: row.refunded_at,
      created_at: row.created_at,
      // only present on createOrder response
      // client needs this to open Razorpay payment UI
      order: order
        ? {
            id: order.id,
            amount: order.amount,
            currency: order.currency,
            key_id: config.RAZORPAY_KEY_ID,
          }
        : undefined,
    };
  }
}

export const paymentsService = new PaymentsService();
