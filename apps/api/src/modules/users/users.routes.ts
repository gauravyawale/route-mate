import { FastifyInstance } from "fastify";
import { userController } from "./users.controller";
import { authenticate } from "../../middleware/authenticate";

export const userRoutes = async (app: FastifyInstance) => {
  // All routes in this plugin require authentication
  app.addHook("preHandler", authenticate);

  app.get("/me", userController.getMe.bind(userController));
  app.patch("/me", userController.updateMe.bind(userController));
  app.patch("/me/mode", userController.switchMode.bind(userController));
};
