# AI Job Hunting Agent

Foundation for an autonomous AI job hunting platform. Phase 1 includes project setup,
architecture, workspace packages, app shells, Docker, and CI.

## Apps

- `apps/api`: Fastify API with health check, centralized config, logging, and error handling.
- `apps/dashboard`: Next.js dashboard with placeholder routes.

## Packages

- `packages/shared`: Shared TypeScript contracts and enums.
- `packages/logger`: Reusable Pino logger.
- `packages/config`: Centralized environment configuration.
- `packages/database`: Prisma and PostgreSQL package scaffold.

## Local Development

```bash
pnpm install
cp .env.example .env
pnpm dev
```

## Docker

```bash
docker compose up --build
```

The API runs on `http://localhost:4000`, and the dashboard runs on `http://localhost:3000`.
