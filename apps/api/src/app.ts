import Fastify from "fastify";
import { connectDB } from "./infrastructure/db/client.js";
import { connectRedis } from "./infrastructure/redis/client.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { registerErrorhandler } from "./middleware/error-handler.js";
import { authenticate } from "./middleware/authenticate.js";
import { requireMode } from "./middleware/authorize.js";

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

// ─── Register Routes ───────────────────────────────────────
app.register(authRoutes, { prefix: "/api/v1/auth" });

// ─── Register Middleware ───────────────────────────────────
// Error handler
registerErrorhandler(app);
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
