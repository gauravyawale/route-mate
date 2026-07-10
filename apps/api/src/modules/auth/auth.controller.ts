import {
  RefreshTokenInput,
  SendOtpInput,
  VerifyOtpInput,
} from "@route-mate/shared";
import { FastifyReply, FastifyRequest } from "fastify";
import { authService } from "./auth.service";

export class AuthController {
  async sendOtp(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as SendOtpInput;
    const result = await authService.sendOtp(body);
    return reply.code(200).send({ data: result });
  }

  async verifyOtp(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as VerifyOtpInput;
    const result = await authService.verifyOtp(body);
    return reply.code(200).send({ data: result });
  }

  async refresh(req: FastifyRequest, reply: FastifyReply) {
    const { refreshToken } = req.body as RefreshTokenInput;
    const result = await authService.refreshToken(refreshToken);
    return reply.code(200).send({ data: result });
  }

  async logout(req: FastifyRequest, reply: FastifyReply) {
    const { refreshToken } = req.body as RefreshTokenInput;
    const result = await authService.logout(refreshToken);
    return reply.code(200).send({ data: result });
  }

  async demoLogin(req: FastifyRequest, reply: FastifyReply) {
    const { role } = req.body as { role: "rider" | "driver" | "admin" };
    const result = await authService.demoLogin(role);
    return reply.code(200).send({ data: result });
  }
}

export const authController = new AuthController();
