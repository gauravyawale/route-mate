import Fastify from "fastify";
import { connectDB } from "./infrastructure/db/client.js";
import { connectRedis } from "./infrastructure/redis/client.js";

const app = Fastify({
  logger: {
    transport: {
      target: "pino-pretty", // readable logs in development
      options: {
        colorize: true,
      },
    },
  },
});

// ─── Startup Hook ──────────────────────────────────────────
// onReady fires after all plugins registered, before accepting requests
app.addHook("onReady", async () => {
  await connectDB();
  await connectRedis();
});

// ─── Shutdown Hook ─────────────────────────────────────────
// onClose fires when app.close() is called (graceful shutdown)
app.addHook("onClose", async () => {
  console.log("Shutting down gracefully...");
});

export default app;
