import { FastifyInstance } from "fastify";
import { vehicleController } from "./vehicles.controller";
import { authenticate } from "../../middleware/authenticate";
import { requireMode } from "../../middleware/authorize";

export const vehicleRoutes = async (app: FastifyInstance) => {
  // All routes in this plugin require authentication
  app.addHook("preHandler", authenticate);
  app.addHook("preHandler", requireMode("driver"));
  app.get(
    "/me/vehicles",
    vehicleController.getMyVehicles.bind(vehicleController),
  );
  app.post(
    "/me/vehicles",
    vehicleController.addVehicle.bind(vehicleController),
  );
  app.patch(
    "/me/vehicles/:id",
    vehicleController.setVehicleActive.bind(vehicleController),
  );
};
