import cors from "@fastify/cors";
import Fastify, { type FastifyError, type FastifyInstance } from "fastify";

import { createLoggerOptions } from "@job-hunter/logger";
import type { ApiResponse } from "@job-hunter/shared";

import { registerHealthRoute } from "./routes/health.js";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: createLoggerOptions({ name: "api" }),
  });

  await app.register(cors, {
    origin: true,
  });

  app.setErrorHandler((error: FastifyError, request, reply) => {
    request.log.error({ error }, "Unhandled API error");

    const statusCode = error.statusCode ?? 500;
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: error.code ?? "INTERNAL_SERVER_ERROR",
        message: statusCode >= 500 ? "Internal server error" : error.message,
      },
    };

    void reply.status(statusCode).send(response);
  });

  registerHealthRoute(app);

  return app;
}
