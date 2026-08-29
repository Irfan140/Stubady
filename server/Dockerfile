# syntax=docker/dockerfile:1.7
ARG BUN_VERSION=1.2-alpine

FROM oven/bun:${BUN_VERSION} AS base
WORKDIR /app
ENV NODE_ENV=production

FROM base AS deps
COPY package.json bun.lock ./
COPY prisma ./prisma
RUN bun install --frozen-lockfile || bun install

FROM deps AS builder
COPY tsconfig.json prisma7.config.ts ./
COPY src ./src
COPY types ./types
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" bunx --bun prisma generate

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache wget tini
RUN addgroup --system --gid 1001 appgroup \
 && adduser --system --uid 1001 --ingroup appgroup appuser
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/generated ./generated
COPY package.json tsconfig.json prisma7.config.ts ./
COPY prisma ./prisma
COPY src ./src
COPY types ./types
RUN chown -R appuser:appgroup /app
USER appuser
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/health || exit 1
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["sh", "-c", "bunx --bun prisma migrate deploy && bun run src/index.ts"]
