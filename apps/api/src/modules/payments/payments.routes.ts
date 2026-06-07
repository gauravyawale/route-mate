import { FastifyInstance } from "fastify";
import { paymentsController } from "./payments.controller";
import { authenticate } from "../../middleware/authenticate";
import { requireMode } from "../../middleware/authorize";

export const paymentRoutes = async (app: FastifyInstance) => {
  // POST /payments — rider creates a Razorpay order
  app.post(
    "/",
    { preHandler: [authenticate, requireMode("rider")] },
    paymentsController.createOrder.bind(paymentsController),
  );

  // POST /payments/verify — rider submits payment result for verification
  app.post(
    "/verify",
    { preHandler: [authenticate, requireMode("rider")] },
    paymentsController.verifyPayment.bind(paymentsController),
  );

  // GET /payments/:bookingId — rider checks payment status
  app.get(
    "/:bookingId",
    { preHandler: [authenticate, requireMode("rider")] },
    paymentsController.getPaymentByBookingId.bind(paymentsController),
  );
};
