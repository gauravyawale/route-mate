import { Queue } from "bullmq";
import { bullMQConnection } from "./client";

/**
 * Booking Queue for processing booking-related tasks asynchronously.
 * TODO: will need to add actual workers later
 * For now we just enqueue - the queue client is real, workers are stubs
 */
export const bookingQueue = new Queue("bookings", {
  connection: bullMQConnection,
  defaultJobOptions: {
    attempts: 5, // retry up to 5 times on failure
    backoff: { type: "exponential", delay: 1000 }, // exponential backoff starting at 1s
    removeOnComplete: true, // auto-remove completed jobs
    removeOnFail: false, // keep failed jobs for debugging
  },
});

export type BookingJobName =
  | "booking.confirmed" // notify rider driver confirmed
  | "booking.cancelled" // notify rider/driver of cancellation
  | "booking.no_seat" // notify rider seat race lost
  | "ride.cancelled"; // notify all paid riders of refund

export interface BookingJobData {
  bookingId: string;
  rideId?: string;
  riderId?: string;
  driverId?: string;
}

export const refundQueue = new Queue("refunds", {
  connection: bullMQConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 60000 }, // 1min, 2min, 4min
    removeOnComplete: true,
    removeOnFail: false, // keep for audit
  },
});
