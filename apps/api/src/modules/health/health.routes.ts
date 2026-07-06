import { FastifyInstance } from "fastify";
import { healthController } from "./health.controller.js";

export const healthRoutes = async (app: FastifyInstance) => {
  // GET /api/v1/health
  app.get("/health", healthController.getHealth.bind(healthController));

  // HEAD /api/v1/health
  app.head("/health", healthController.headHealth.bind(healthController));
};
