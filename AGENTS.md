# Stubady — Agent Guide

Independent packages: `server` (Bun + Express + Prisma + pgvector/Redis/BullMQ/LangChain) and `mobile` (Expo 55 + React Native + Expo Router + Clerk). No Bun workspaces — each folder is standalone.

## Project Structure — Independent Packages (No Bun Workspaces)

```
Ai-Study-Buddy/
├── server/   # Bun API — src/index.ts, Prisma, BullMQ workers (independent package)
│   ├── eslint.config.js / .prettierrc / .prettierignore  # local lint/format
│   └── package.json / bun.lock  # run `bun install` inside server/
├── mobile/   # Expo app — src/app/ (Expo Router), src/features/, src/components/ (independent package)
│   ├── eslint.config.js / .prettierrc / .prettierignore  # local lint/format
│   └── package.json / bun.lock  # run `bun install` inside mobile/
├── package.json  # root helpers (typecheck/dev only, no lint deps)
└── docker-compose.yml # postgres (pgvector:pg18) + redis:7  (dev: DB only)
```

`server/` and `mobile/` are **completely independent** — no `workspaces` field, each has its own `eslint.config.js`, `.prettierrc`, `.prettierignore`, `bun.lock` and `node_modules`. Run `bun install` separately inside each folder. Root does not manage them.

## Commands — always prefer `bunx` over `npx` (`bun.lock` present)

```bash
bun install --cwd server             # install server only
bun install --cwd mobile             # install mobile only
# alternative: `cd server && bun install` / `cd mobile && bun install`

bun run --cwd server lint            # eslint . inside server/ (uses server/eslint.config.js)
bun run --cwd server lint:fix
bun run --cwd server format          # prettier inside server/
bun run --cwd mobile lint            # eslint . inside mobile/ (uses mobile/eslint.config.js)
bun run --cwd mobile lint:fix
bun run --cwd mobile format

bun run --cwd server dev             # or bun run dev:server from root
bun run --cwd mobile start           # or bun run dev:mobile from root

# Root helpers (only for root files — server/mobile are independent)
bun run typecheck                    # server tsc + mobile tsc

bun --cwd=server x prisma migrate dev # create migration (or `cd server && bunx prisma migrate dev`)
bun --cwd=server x prisma generate    # regenerate client (also postinstall)

# Mobile / Expo — ALWAYS use expo install for SDK-compatible versions
bun --cwd=mobile x expo install <pkg>
bun run --cwd mobile expo start      # or `cd mobile && bunx expo start`
bun --cwd=mobile x expo-doctor
bunx eas-cli build --profile development --platform android  # or bun --cwd=mobile x eas build
```

Run `bun run --cwd server lint` + `bun run --cwd server format:check` and `bun run --cwd mobile lint` before declaring any task done.

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

- Each package owns its lint/format — `server/eslint.config.js` / `server/.prettierrc` and `mobile/eslint.config.js` / `mobile/.prettierrc` are independent (no root delegation).
- Do not use `npm`/`yarn`/`pnpm add` — use `bunx expo install` (mobile) or `bun add` (server) and verify SDK compatibility.
- Keep `bun.lock` per package (`server/bun.lock`, `mobile/bun.lock`); do not delete.
- For Prisma changes: edit `server/prisma/schema.prisma`, then `bun --cwd=server x prisma migrate dev` and verify `prisma generate`.
- For new routes/screens: follow existing `repositories → services → routes → schemas` (server) and `src/features/*/api.ts` + `src/app/` (mobile) patterns.
