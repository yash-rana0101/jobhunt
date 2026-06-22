import { buildApp } from "./app.js";
import { env } from "./env.js";

const app = await buildApp();

try {
  await app.listen({
    host: "0.0.0.0",
    port: env.API_PORT,
  });
} catch (error) {
  app.log.error({ error }, "Failed to start API server");
  process.exit(1);
}
