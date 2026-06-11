import { FastifyReply, FastifyRequest } from "fastify";
import { paymentsService } from "./payments.service";
import {
  CreatePaymentOrderInput,
  VerifyPaymentInput,
} from "@route-mate/shared";

export class PaymentsController {
  async createOrder(req: FastifyRequest, reply: FastifyReply) {
    const input = req.body as CreatePaymentOrderInput;
    const result = await paymentsService.createOrder(req.user.id, input);
    return reply.code(201).send({ data: result });
  }

  async verifyPayment(req: FastifyRequest, reply: FastifyReply) {
    const input = req.body as VerifyPaymentInput;
    const result = await paymentsService.verifyPayment(req.user.id, input);
    return reply.code(200).send({ data: result });
  }

  async getPaymentByBookingId(req: FastifyRequest, reply: FastifyReply) {
    const { bookingId } = req.params as { bookingId: string };
    const result = await paymentsService.getPaymentByBookingId(
      req.user.id,
      bookingId,
    );
    return reply.code(200).send({ data: result });
  }
}

export const paymentsController = new PaymentsController();
