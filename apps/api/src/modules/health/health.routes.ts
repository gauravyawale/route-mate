import { FastifyInstance } from "fastify";
import { healthController } from "./health.controller.js";

export const healthRoutes = async (app: FastifyInstance) => {
  // GET /health
  app.get("/", healthController.getHealth.bind(healthController));

  // HEAD /health (Required for curl -I and Load Balancer checks)
  app.head("/", healthController.headHealth.bind(healthController));
};
