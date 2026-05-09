import { FastifyInstance, FastifyError } from "fastify";
import { AppError } from "../utils/errors";

export const registerErrorhandler = (app: FastifyInstance) => {
  app.setErrorHandler((error: FastifyError | AppError, request, reply) => {
    const statusCode =
      (error as AppError).statusCode ?? error.statusCode ?? 500;

    // Log server errors, not client errors
    if (statusCode >= 500) {
      request.log.error(error);
    }

    return reply.code(statusCode).send({
      error: {
        message: error.message,
        code: error.code || "INTERNAL_SERVER_ERROR",
        ...(process.env.NODE_ENV === "development" && {
          stack: error.stack,
        }),
      },
    });
  });
};
