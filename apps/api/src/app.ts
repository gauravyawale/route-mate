import Fastify from "fastify";
import { connectDB } from "./infrastructure/db/client.js";
import { connectRedis } from "./infrastructure/redis/client.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { registerErrorhandler } from "./middleware/error-handler.js";
import { userRoutes } from "./modules/users/users.routes.js";
// import helmet from "@fastify/helmet";
// import cors from "@fastify/cors";
// import rateLimit from "@fastify/rate-limit";
import { config } from "./config/index.js";
import { vehicleRoutes } from "./modules/vehicles/vehicles.routes.js";
import { rideRoutes } from "./modules/rides/rides.routes.js";
import { bookingRoutes } from "./modules/bookings/bookings.routes";

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

// TODO: Add more security headers and configure CORS properly in production

// ─── Register Routes ───────────────────────────────────────
app.register(authRoutes, { prefix: "/api/v1/auth" });

app.register(userRoutes, { prefix: "/api/v1/users" });

app.register(vehicleRoutes, { prefix: "/api/v1/users" });

app.register(rideRoutes, { prefix: "/api/v1/rides" });

app.register(bookingRoutes, { prefix: "/api/v1/bookings" });
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
