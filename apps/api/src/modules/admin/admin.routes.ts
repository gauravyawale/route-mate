import { FastifyInstance } from "fastify";
import { adminController } from "./admin.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { requireAdmin } from "../../middleware/authorize.js";

export const adminRoutes = async (app: FastifyInstance) => {
  app.get(
    "/stats",
    { preHandler: [authenticate, requireAdmin] },
    adminController.getStats.bind(adminController),
  );

  app.get(
    "/rides",
    { preHandler: [authenticate, requireAdmin] },
    adminController.getRides.bind(adminController),
  );

  app.get(
    "/rides/:rideId",
    { preHandler: [authenticate, requireAdmin] },
    adminController.getRideDetail.bind(adminController),
  );

  app.get(
    "/users",
    { preHandler: [authenticate, requireAdmin] },
    adminController.getUsers.bind(adminController),
  );
};
