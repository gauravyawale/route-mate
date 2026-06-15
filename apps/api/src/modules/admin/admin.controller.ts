import { FastifyReply, FastifyRequest } from "fastify";
import { adminService } from "./admin.service.js";

export class AdminController {
  async getStats(req: FastifyRequest, reply: FastifyReply) {
    const result = await adminService.getStats();
    return reply.code(200).send({ data: result });
  }

  async getRides(req: FastifyRequest, reply: FastifyReply) {
    const { status } = req.query as { status?: string };
    const result = await adminService.getRides(status);
    return reply.code(200).send({ data: result });
  }

  async getRideDetail(req: FastifyRequest, reply: FastifyReply) {
    const { rideId } = req.params as { rideId: string };
    const result = await adminService.getRideDetail(rideId);
    return reply.code(200).send({ data: result });
  }

  async getUsers(req: FastifyRequest, reply: FastifyReply) {
    const { search } = req.query as { search?: string };
    const result = await adminService.getUsers(search);
    return reply.code(200).send({ data: result });
  }
}

export const adminController = new AdminController();
