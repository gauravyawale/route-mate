import { Worker, Job } from "bullmq";
import { bullMQConnection } from "../client";
import { BookingJobData } from "../bookingQueue";

/**
 * Booking notification worker
 * replace console.log with Socket.io push
 * Each job name maps to a different notification type
 */
const worker = new Worker<BookingJobData>(
  "bbokings",
  async (job: Job<BookingJobData>) => {
    switch (job.name) {
      case "booking.requested":
        // TODO Phase 5: push to driver's socket
        console.log(
          `[booking.requested] notify driver ${job.data.driverId} — ` +
            `rider ${job.data.riderId} requested booking ${job.data.bookingId}`,
        );
        break;

      case "booking.confirmed":
        // TODO Phase 5: push to rider's socket
        console.log(
          `[booking.confirmed] notify rider ${job.data.riderId} — ` +
            `booking ${job.data.bookingId} confirmed, payment now open`,
        );
        break;

      case "booking.cancelled":
        // TODO Phase 5: push to rider and driver sockets
        console.log(
          `[booking.cancelled] notify parties — ` +
            `booking ${job.data.bookingId} cancelled`,
        );
        break;

      case "booking.no_seat":
        // TODO Phase 5: push to rider's socket
        console.log(
          `[booking.no_seat] notify rider ${job.data.riderId} — ` +
            `booking ${job.data.bookingId} lost seat race`,
        );
        break;

      default:
        console.warn(`[booking.worker] unknown job name: ${job.name}`);
    }
  },
  {
    connection: bullMQConnection,
    concurrency: 10, // process up to 10 jobs simultaneously
  },
);

worker.on("ready", () => {
  console.log("[booking.worker] worker is ready and listening for jobs");
});

worker.on("active", (job) => {
  console.log(`[booking.worker] job ${job.id} (${job.name}) is now active`);
});

worker.on("error", (err) => {
  console.error("[booking.worker] worker error:", err);
});

worker.on("completed", (job) => {
  console.log(`[booking.worker] job ${job.id} (${job.name}) completed`);
});

worker.on("failed", (job, err) => {
  console.error(
    `[booking.worker] job ${job?.id} (${job?.name}) failed:`,
    err.message,
  );
});

export default worker;
