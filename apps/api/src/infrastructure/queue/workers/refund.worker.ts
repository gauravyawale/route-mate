import { Worker, Job } from "bullmq";
import { bullMQConnection } from "../client";
import { paymentsService } from "../../../modules/payments/payments.service";
import { queryOne } from "../../db/client";

interface RefundJobData {
  bookingId: string;
  rideId: string;
  riderId: string;
}

const worker = new Worker<RefundJobData>(
  "refunds",
  async (job: Job<RefundJobData>) => {
    console.log(
      `[refund.worker] processing refund for booking ${job.data.bookingId}`,
    );

    await paymentsService.refundPayment(job.data.bookingId);

    console.log(
      `[refund.worker] refund successful for booking ${job.data.bookingId}`,
    );
  },
  {
    connection: bullMQConnection,
    concurrency: 3, // refunds are sensitive — process fewer at once
  },
);

worker.on("completed", (job) => {
  console.log(`[refund.worker] job ${job.id} completed`);
});

// on final failure after all retries — mark payment as refund_failed
worker.on("failed", async (job, err) => {
  console.error(
    `[refund.worker] job ${job?.id} permanently failed:`,
    err.message,
  );

  if (job?.data?.bookingId) {
    try {
      await queryOne(
        `UPDATE payments SET
          status         = 'refund_failed',
          failure_reason = $1
        WHERE booking_id = $2
        AND status       = 'success'
        RETURNING id`,
        [err.message, job.data.bookingId],
      );

      console.error(
        `[refund.worker] marked payment as refund_failed ` +
          `for booking ${job.data.bookingId} — manual intervention required`,
      );
    } catch (dbErr) {
      console.error(
        `[refund.worker] failed to mark refund_failed in DB:`,
        dbErr,
      );
    }
  }
});

export default worker;
