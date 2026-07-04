import { FastifyReply, FastifyRequest } from "fastify";
import { ridesService } from "./rides.service";
import {
  CreateRideInput,
  SearchRidesInput,
  UpdateRideStatusInput,
} from "@route-mate/shared";

export class RidesController {
  async createRide(req: FastifyRequest, reply: FastifyReply) {
    const input = req.body as CreateRideInput;
    const result = await ridesService.createRide(req.user.id, input);
    return reply.code(201).send({ data: result });
  }

  async searchRides(req: FastifyRequest, reply: FastifyReply) {
    const input = req.query as SearchRidesInput;
    const result = await ridesService.searchRides(input);
    return reply.code(200).send({ data: result });
  }

  async getRideById(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const result = await ridesService.getRideById(id);
    return reply.code(200).send({ data: result });
  }

  async updateRideStatus(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const input = req.body as UpdateRideStatusInput;
    const result = await ridesService.updateRideStatus(req.user.id, id, input);
    return reply.code(200).send({ data: result });
  }

  async cancelRide(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const { reason } = req.body as { reason?: string };
    const result = await ridesService.cancelRide(req.user.id, id, reason);
    return reply.code(200).send({ data: result });
  }

  async snapToRoute(req: FastifyRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const { lat, lng } = req.body as { lat: number; lng: number };
    const result = await ridesService.snapToRoute({ ride_id: id, lat, lng });
    return reply.code(200).send({ data: result });
  }
}

export const ridesController = new RidesController();
