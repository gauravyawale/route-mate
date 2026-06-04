import { FastifyReply, FastifyRequest } from "fastify";
import { bookingsService } from "./bookings.service";
import { CancelBookingInput, RequestBookingInput } from "@route-mate/shared";

export class BookingsController {
  async requestBooking(req: FastifyRequest, reply: FastifyReply) {
    const input = req.body as RequestBookingInput;
    const result = await bookingsService.requestBooking(req.user.id, input);
    return reply.code(201).send({ data: result });
  }

  async confirmBooking(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const result = await bookingsService.confirmBooking(req.user.id, id);
    return reply.code(200).send({ data: result });
  }

  async cancelBooking(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const input = req.body as CancelBookingInput;
    const result = await bookingsService.cancelBooking(req.user.id, id, input);
    return reply.code(200).send({ data: result });
  }

  async getMyBookings(req: FastifyRequest, reply: FastifyReply) {
    const result = await bookingsService.getMyBookings(req.user.id);
    return reply.code(200).send({ data: result });
  }

  async getRideBookings(req: FastifyRequest, reply: FastifyReply) {
    const { rideId } = req.params as { rideId: string };
    const result = await bookingsService.getRideBookings(req.user.id, rideId);
    return reply.code(200).send({ data: result });
  }
}

export const bookingsController = new BookingsController();
