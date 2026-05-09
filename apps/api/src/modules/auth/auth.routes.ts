import { FastifyInstance } from "fastify";
import { authController } from "./auth.controller.js";

export const authRoutes = async (app: FastifyInstance) => {
  app.post("/send-otp", authController.sendOtp.bind(authController));
  app.post("/verify-otp", authController.verifyOtp.bind(authController));
  app.post("/refresh", authController.refresh.bind(authController));
  app.post("/logout", authController.logout.bind(authController));
};
