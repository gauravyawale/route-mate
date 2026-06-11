import { FastifyReply, FastifyRequest } from "fastify";
import { onboardingService } from "./onboarding.service.js";
import { ApplyDriverInput, ReviewDriverInput } from "@route-mate/shared";

export class OnboardingController {
  async applyAsDriver(req: FastifyRequest, reply: FastifyReply) {
    const input = req.body as ApplyDriverInput;
    const result = await onboardingService.applyAsDriver(req.user.id, input);
    return reply.code(201).send({ data: result });
  }

  async getMyApplicationStatus(req: FastifyRequest, reply: FastifyReply) {
    const result = await onboardingService.getMyApplicationStatus(req.user.id);
    return reply.code(200).send({ data: result });
  }

  async getPendingApplications(req: FastifyRequest, reply: FastifyReply) {
    const result = await onboardingService.getPendingApplications();
    return reply.code(200).send({ data: result });
  }

  async approveDriver(req: FastifyRequest, reply: FastifyReply) {
    const { userId } = req.params as { userId: string };
    const result = await onboardingService.approveDriver(req.user.id, userId);
    return reply.code(200).send({ data: result });
  }

  async rejectDriver(req: FastifyRequest, reply: FastifyReply) {
    const { userId } = req.params as { userId: string };
    const input = req.body as ReviewDriverInput;
    const result = await onboardingService.rejectDriver(
      req.user.id,
      userId,
      input,
    );
    return reply.code(200).send({ data: result });
  }
}

export const onboardingController = new OnboardingController();
