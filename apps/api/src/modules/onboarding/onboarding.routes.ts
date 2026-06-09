import { FastifyInstance } from "fastify";
import { onboardingController } from "./onboarding.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { requireAdmin } from "../../middleware/authorize.js";

export const onboardingRoutes = async (app: FastifyInstance) => {
  // ── User routes ───────────────────────────────────────────

  // POST /onboarding/apply — any authenticated user applies to be a driver
  app.post(
    "/apply",
    { preHandler: [authenticate] },
    onboardingController.applyAsDriver.bind(onboardingController),
  );

  // GET /onboarding/status — user checks their own application status
  app.get(
    "/status",
    { preHandler: [authenticate] },
    onboardingController.getMyApplicationStatus.bind(onboardingController),
  );

  // ── Admin routes ──────────────────────────────────────────

  // GET /onboarding/admin/pending — admin lists all pending applications
  app.get(
    "/admin/pending",
    { preHandler: [authenticate, requireAdmin] },
    onboardingController.getPendingApplications.bind(onboardingController),
  );

  // POST /onboarding/admin/:userId/approve — admin approves a driver
  app.post(
    "/admin/:userId/approve",
    { preHandler: [authenticate, requireAdmin] },
    onboardingController.approveDriver.bind(onboardingController),
  );

  // POST /onboarding/admin/:userId/reject — admin rejects a driver
  app.post(
    "/admin/:userId/reject",
    { preHandler: [authenticate, requireAdmin] },
    onboardingController.rejectDriver.bind(onboardingController),
  );
};
