import app from "./app";
import { initSocket } from "./infrastructure/socket";
import "./infrastructure/queue/workers/booking.worker.js";
import "./infrastructure/queue/workers/refund.worker.js";

const start = async () => {
  try {
    await app.listen({ port: 3000, host: "0.0.0.0" });
    // attach Socket.io to Fastify's underlying http.Server
    // Initialize Socket.io after Fastify is listening
    initSocket(app.server);

    app.log.info("✅ Socket.io started");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
