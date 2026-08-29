# Stubady — Agent Guide

Monorepo with Bun workspaces: `server` (Bun + Express + Prisma + pgvector/Redis/BullMQ/LangChain) and `mobile` (Expo 55 + React Native + Expo Router + Clerk). Root owns shared tooling.

## Workspaces

```
Ai-Study-Buddy/
├── server/   # Bun API — src/index.ts, Prisma, BullMQ workers
├── mobile/   # Expo app — src/app/ (Expo Router), src/features/, src/components/
├── eslint.config.js   # SINGLE source — do NOT create server/mobile eslint configs
├── .prettierrc / .prettierignore  # SINGLE source — do NOT create per-package configs
├── package.json # workspaces: ["server","mobile"]
└── docker-compose.yml # postgres (pgvector:pg18) + redis:7
```

`server/package.json` and `mobile/package.json` lint/format scripts delegate to root: `eslint --config ../eslint.config.js` / `prettier --config ../.prettierrc`. Run tooling from root when possible.

## Commands — always prefer `bunx` over `npx` (`bun.lock` present)

```bash
bun install                          # install all workspaces (run at root)
bun run lint                         # eslint . (root) — lints server + mobile
bun run lint:fix                      # eslint . --fix
bun run format                       # prettier --write .
bun run format:check                 # prettier --check .
bun run typecheck                    # server tsc + mobile tsc
bun run dev:server                   # bun run --cwd server dev
bun run dev:mobile                   # bun run --cwd mobile start

# Package-scoped alternatives
bun run --cwd server lint            # same as above, scoped
bun run --cwd mobile lint
bunx --cwd server prisma migrate dev # create migration
bunx --cwd server prisma generate    # regenerate client (also postinstall)

# Mobile / Expo — ALWAYS use expo install for SDK-compatible versions
bunx --cwd mobile expo install <pkg>
bunx --cwd mobile expo start
bunx --cwd mobile expo-doctor
bunx eas-cli build --profile development --platform android  # or bunx --cwd mobile eas build
```

Run `bun run lint` + `bun run format:check` before declaring any task done.

## Server conventions

- Runtime: `Bun` + `Express 5`, entry `server/src/index.ts` (re-exports `server/src/app.ts` for tests).
- DB: Prisma 7 with `pgvector` (`vector(1536)` for `text-embedding-3-small`), datasource `postgresql` + `extensions=[vector]`. Config in `server/prisma7.config.ts`, schema `server/prisma/schema.prisma`.
- Infra: `ioredis` + `BullMQ` (ingestion queue), `pino` + `pino-http` (redacted), `helmet`/`cors`/`compression`/`express-rate-limit`+`rate-limit-redis`.
- Auth: `@clerk/express` `verifyToken` via `requireAuth` middleware; `x-access-token` fallback supported.
- AI: `LangChain` + `LangGraph` + `OpenAI` (chat + embeddings), `Firecrawl` for web sources, R2 (S3) for PDFs.
- Structure: `src/config/`, `src/lib/`, `src/middlewares/`, `src/routes/`, `src/services/`, `src/repositories/`, `src/schemas/`, `src/queues/`, `src/workers/`, `src/processors/`, `src/utils/`.
- Env: validated with `zod` in `src/config/env.ts` (loads `.env` then `.env.development`). Never hardcode secrets — use `env.*`.
- No `console.log` — use `pino` logger. Keep comments minimal — explain *why*, not *what*.

## Mobile conventions — Expo has changed, do not trust training data

Before writing any Expo/EAS/React Native code:

1. Read `expo` major version from `mobile/package.json` (currently `~55.0.30`).
2. Fetch matching docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch `https://docs.expo.dev/llms.txt` and follow its links. Never answer from memory.

- Navigation: **Expo Router only**. Routes in `mobile/src/app/` — every file is a screen, `_layout.tsx` defines navigators. Keep components/hooks/utils outside `src/app/`. Import `Link`, `router`, `useLocalSearchParams` from `expo-router`.
- `ios/` and `android/` are CNG (Continuous Native Generation) — never create/edit by hand; configure via `mobile/app.config.ts` and config plugins.
- Expo Go only has bundled natives — after adding native code, build dev client: `bunx --cwd mobile expo run:android|ios` or `eas build --profile development`.
- Prefer Expo modules over third-party libs. Check `mobile/MUSE.md` or `https://docs.expo.dev/versions/latest/index.md` before adding deps.
- State: `zustand` + `@tanstack/react-query` + `zod` + `react-hook-form`.
- Path alias `@/*` → `mobile/src/*` (`tsconfig.json`).

## Building with EAS

```bash
bunx --cwd mobile eas build --profile development --platform android
bunx --cwd mobile eas build --profile preview --platform android
bunx eas-cli submit / eas update   # cloud sign/submit/OTA
```

Profiles in `mobile/eas.json` (development/preview/production). Secrets injected via `EXPO_PUBLIC_*` in `.github/workflows/android-build.yml`.

## Env & secrets

- Never commit `.env` / `.env.development`. Examples in `server/.env.example` + `mobile/.env.example`.
- `docker-compose.yml` uses local dev creds `myuser/mypassword` — do not reuse in production.
- Mobile `EXPO_PUBLIC_*` vars are inlined at build time via `mobile/src/config/env.ts`.

## Rules

- Do not add `server/eslint.config.js`, `server/.prettierrc`, or `mobile/eslint.config.js` — root is the single source. Extend root `eslint.config.js` with overrides instead.
- Do not use `npm`/`yarn`/`pnpm add` — use `bunx expo install` (mobile) or `bun add` (server) and verify SDK compatibility.
- Keep `bun.lock` at root + per-workspace; do not delete.
- For Prisma changes: edit `server/prisma/schema.prisma`, then `bunx --cwd server prisma migrate dev` and verify `prisma generate`.
- For new routes/screens: follow existing `repositories → services → routes → schemas` (server) and `src/features/*/api.ts` + `src/app/` (mobile) patterns.
