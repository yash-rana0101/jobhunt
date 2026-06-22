import cors from "@fastify/cors";
import Fastify, { type FastifyError, type FastifyInstance } from "fastify";

import { createLoggerOptions } from "@job-hunter/logger";
import type { ApiResponse } from "@job-hunter/shared";

import { registerCandidateRoutes } from "./routes/candidate.js";
import { registerHealthRoute } from "./routes/health.js";
import { registerJobRoutes } from "./routes/jobs.js";
import { registerMatchRoutes } from "./routes/matches.js";
import { registerContactRoutes } from "./routes/contacts.js";
import { registerOutreachRoutes } from "./routes/outreach.js";

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

  registerCandidateRoutes(app);
  registerHealthRoute(app);
  registerJobRoutes(app);
  registerMatchRoutes(app);
  registerContactRoutes(app);
  registerOutreachRoutes(app);

  return app;
}
