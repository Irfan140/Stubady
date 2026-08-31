# syntax=docker/dockerfile:1.7
ARG BUN_VERSION=1.4.0-alpine

FROM oven/bun:${BUN_VERSION} AS base
WORKDIR /app
ENV NODE_ENV=production

# ---- Deps: install with frozen lockfile (fail fast in prod) ----
FROM base AS deps
COPY package.json bun.lock ./
COPY prisma ./prisma
# Use frozen lockfile strictly for reproducible prod builds — no fallback
RUN bun install --frozen-lockfile

# ---- Builder: generate Prisma client (does not need live DB) ----
FROM deps AS builder
COPY tsconfig.json prisma7.config.ts ./
COPY src ./src
COPY types ./types
# Dummy DATABASE_URL satisfies prisma7.config.ts env("DATABASE_URL") at generate time
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" bunx --bun prisma generate

# ---- Runner: minimal prod image, non-root, no dev deps ----
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache wget tini
RUN addgroup --system --gid 1001 appgroup \
 && adduser --system --uid 1001 --ingroup appgroup appuser

# Copy pruned prod deps: reinstall with --production to drop devDependencies and prisma CLI
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production && \
    rm -rf /root/.bun/install/cache

COPY --from=builder /app/generated ./generated
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma
COPY tsconfig.json prisma7.config.ts ./
COPY src ./src
COPY types ./types

# Support bind-mounts like compose volumes by ensuring ownership
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]

# Starts the backend without trying to perform a database migration automatically.
CMD ["bun", "run", "src/index.ts"]

# This means migrations become an explicit deployment operation rather than something that happens every time the container starts/restarts.
