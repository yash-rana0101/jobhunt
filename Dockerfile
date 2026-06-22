FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages
COPY agents ./agents
COPY docs ./docs
COPY prompts ./prompts
COPY resume ./resume

RUN pnpm install --no-frozen-lockfile

FROM base AS api-builder
RUN pnpm build:packages && pnpm --filter @job-hunter/api build

FROM node:22-alpine AS api-runner
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=base /app/packages ./packages
COPY --from=api-builder /app/apps/api ./apps/api
EXPOSE 4000
CMD ["pnpm", "--filter", "@job-hunter/api", "start"]

FROM base AS dashboard-builder
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build:packages && pnpm --filter @job-hunter/dashboard build

FROM node:22-alpine AS dashboard-runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=base /app/packages ./packages
COPY --from=dashboard-builder /app/apps/dashboard ./apps/dashboard
EXPOSE 3000
CMD ["pnpm", "--filter", "@job-hunter/dashboard", "start"]
