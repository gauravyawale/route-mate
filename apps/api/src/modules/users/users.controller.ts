import { FastifyReply, FastifyRequest } from "fastify";
import { usersService } from "./users.service";
import { SwitchModeInput, UpdateProfileInput } from "@route-mate/shared";

export class UserController {
  async getMe(req: FastifyRequest, reply: FastifyReply) {
    const result = await usersService.getMe(req.user.id);
    return reply.code(200).send({ data: result });
  }

  async updateMe(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as UpdateProfileInput;
    const result = await usersService.updateMe(req.user.id, body);
    return reply.code(200).send({ data: result });
  }

  async switchMode(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as SwitchModeInput;
    const result = await usersService.switchMode(req.user.id, body);
    return reply.code(200).send({ data: result });
  }
}

export const userController = new UserController();
