import { FastifyInstance } from "fastify";
import { ridesController } from "./rides.controller";
import { authenticate } from "../../middleware/authenticate";
import { requireMode } from "../../middleware/authorize";
import { bookingsController } from "../bookings/bookings.controller";

export const rideRoutes = async (app: FastifyInstance) => {
  // GET /rides/search — any authenticated user (rider searching for rides)
  app.get(
    "/search",
    { preHandler: [authenticate] },
    ridesController.searchRides.bind(ridesController),
  );

  // GET /rides/:id — any authenticated user
  app.get(
    "/:id",
    { preHandler: [authenticate] },
    ridesController.getRideById.bind(ridesController),
  );

  // POST /rides — driver only
  app.post(
    "/",
    { preHandler: [authenticate, requireMode("driver")] },
    ridesController.createRide.bind(ridesController),
  );

  // PATCH /rides/:id/status — driver only
  app.patch(
    "/:id/status",
    { preHandler: [authenticate, requireMode("driver")] },
    ridesController.updateRideStatus.bind(ridesController),
  );

  // DELETE /rides/:id — driver only
  app.delete(
    "/:id",
    { preHandler: [authenticate, requireMode("driver")] },
    ridesController.cancelRide.bind(ridesController),
  );

  // GET /rides/:rideId/bookings — driver sees all bookings on their ride
  app.get(
    "/:rideId/bookings",
    { preHandler: [authenticate, requireMode("driver")] },
    bookingsController.getRideBookings.bind(bookingsController),
  );
};
