import type { FastifyInstance } from "fastify";

type HealthResponse = {
  status: "ok";
};

export function registerHealthRoute(app: FastifyInstance): void {
  app.get("/health", (): HealthResponse => {
    return {
      status: "ok",
    };
  });
}
