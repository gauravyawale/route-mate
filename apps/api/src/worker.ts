import "./infrastructure/queue/workers/booking.worker";
import "./infrastructure/queue/workers/refund.worker";

console.log("✅ Workers process started");

// keep process alive
process.on("SIGTERM", async () => {
  console.log("Workers shutting down...");
  process.exit(0);
});
