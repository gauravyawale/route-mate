import Fastify from "fastify";
import { connectDB } from "./infrastructure/db/client.js";
import { connectRedis } from "./infrastructure/redis/client.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { registerErrorhandler } from "./middleware/error-handler.js";
import { userRoutes } from "./modules/users/users.routes.js";
import helmet from "@fastify/helmet";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { config } from "./config/index.js";
import { vehicleRoutes } from "./modules/vehicles/vehicles.routes.js";
import { rideRoutes } from "./modules/rides/rides.routes.js";
import { bookingRoutes } from "./modules/bookings/bookings.routes";
import { paymentRoutes } from "./modules/payments/payments.routes.js";
import { onboardingRoutes } from "./modules/onboarding/onboarding.routes.js";
import { adminRoutes } from "./modules/admin/admin.routes.js";

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
// helmet sets various HTTP headers to help protect the app
// prevents common vulnerabilities like XSS, clickjacking, etc.
app.register(helmet, {
  contentSecurityPolicy: false, // disable for API — no HTML served
});

// cors controls which origins can access the API — configure for production
app.register(cors, {
  origin:
    config.NODE_ENV === "production"
      ? ["https://route-mate-web-iota.vercel.app/"] // replace with real domain
      : true, // allow all in development
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

// rate limiting to prevent abuse — adjust limits as needed
app.register(rateLimit, {
  max: 100,
  timeWindow: "1 minute",
  errorResponseBuilder: () => ({
    error: {
      statusCode: 429,
      message: "Too many requests. Please slow down.",
      code: "RATE_LIMITED",
    },
  }),
});

// ─── Register Routes ───────────────────────────────────────
app.register(authRoutes, { prefix: "/api/v1/auth" });

app.register(userRoutes, { prefix: "/api/v1/users" });

app.register(vehicleRoutes, { prefix: "/api/v1/users" });

app.register(rideRoutes, { prefix: "/api/v1/rides" });

app.register(bookingRoutes, { prefix: "/api/v1/bookings" });

app.register(paymentRoutes, { prefix: "/api/v1/payments" });

app.register(onboardingRoutes, { prefix: "/api/v1/onboarding" });

app.register(adminRoutes, { prefix: "/api/v1/admin" });
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
