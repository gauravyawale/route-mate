import { FastifyReply, FastifyRequest } from "fastify";

export class HealthController {
  async getHealth(req: FastifyRequest, reply: FastifyReply) {
    return reply.code(200).send({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }

  async headHealth(req: FastifyRequest, reply: FastifyReply) {
    // Explicitly handle HEAD requests for curl -I
    return reply.code(200).send();
  }
}

export const healthController = new HealthController();
