import { FastifyInstance } from "fastify";
import { bookingsController } from "./bookings.controller";
import { authenticate } from "../../middleware/authenticate";
import { requireMode } from "../../middleware/authorize";

export const bookingRoutes = async (app: FastifyInstance) => {
  // ── Rider routes ──────────────────────────────────────────

  // POST /bookings — rider requests a booking
  app.post(
    "/",
    { preHandler: [authenticate, requireMode("rider")] },
    bookingsController.requestBooking.bind(bookingsController),
  );

  // GET /bookings/my — rider sees their own bookings
  // must be registered before /:id to avoid "my" being caught as an id
  app.get(
    "/my",
    { preHandler: [authenticate, requireMode("rider")] },
    bookingsController.getMyBookings.bind(bookingsController),
  );

  // POST /bookings/:id/cancel — rider or driver cancels
  // no requireMode — both roles can cancel, permission checked in service
  app.post(
    "/:id/cancel",
    { preHandler: [authenticate] },
    bookingsController.cancelBooking.bind(bookingsController),
  );

  // ── Driver routes ─────────────────────────────────────────

  // POST /bookings/:id/confirm — driver confirms a pending booking
  app.post(
    "/:id/confirm",
    { preHandler: [authenticate, requireMode("driver")] },
    bookingsController.confirmBooking.bind(bookingsController),
  );
};
