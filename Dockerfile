# PhotoRev API — production-oriented image (monorepo backend)
FROM node:22-bookworm-slim AS base

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@10.30.2 --activate

WORKDIR /app

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/backend/package.json ./packages/backend/

RUN pnpm install --frozen-lockfile --filter @photorev/backend... \
  && pnpm --filter @photorev/backend rebuild sharp bcrypt

FROM base AS runner

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/backend/node_modules ./packages/backend/node_modules
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/backend ./packages/backend

WORKDIR /app/packages/backend

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV STORAGE_ROOT=/app/storage

RUN mkdir -p /app/storage

COPY docker/backend-entrypoint.sh /usr/local/bin/backend-entrypoint.sh
RUN chmod +x /usr/local/bin/backend-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/backend-entrypoint.sh"]
CMD ["pnpm", "exec", "tsx", "src/server.ts"]
