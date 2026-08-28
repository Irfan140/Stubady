import type { Request } from "express";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import Redis from "ioredis";
import { RedisStore } from "rate-limit-redis";

import { RATE_LIMITS } from "../config/constants";
import { env } from "../config/env";

/**
 * Shared Redis connection backing the rate-limit counters.
 * Exported so the graceful-shutdown hook can disconnect it.
 *
 * `enableOfflineQueue: false` makes commands fail immediately while the
 * connection is down instead of queuing forever — combined with
 * `passOnStoreError` on the limiters below, a Redis outage degrades to
 * unlimited requests rather than every request hanging.
 */
export const rateLimitRedis = new Redis(env.redisUrl, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
  enableOfflineQueue: false,
});

const CONNECT_TIMEOUT_MS = 3_000;

/**
 * Resolves once the rate-limit Redis connection is ready. Bounded by a
 * timeout so a down Redis cannot hang requests or block boot.
 *
 * The rate-limit stores load their Lua scripts at construction time (module
 * init) with several loads in parallel — so while the initial connection is
 * being established, concurrent calls join the same in-flight wait. Once the
 * connection has been ready at least once, a dropped connection fails fast
 * instead of waiting, and `passOnStoreError` on the limiters lets requests
 * through until Redis reconnects.
 */
let hasBeenReady = false;
let connecting: Promise<void> | null = null;
rateLimitRedis.on("ready", () => {
  hasBeenReady = true;
});
const ensureReady = (): Promise<void> => {
  if (rateLimitRedis.status === "ready") return Promise.resolve();
  if (hasBeenReady) {
    return Promise.reject(new Error("rate-limit redis is not ready"));
  }
  if (connecting) return connecting;
  if (rateLimitRedis.status !== "wait" && rateLimitRedis.status !== "end") {
    return Promise.reject(new Error("rate-limit redis is not ready"));
  }
  connecting = new Promise<void>((resolve, reject) => {
    const onReady = (): void => {
      cleanup();
      resolve();
    };
    const timer = setTimeout(() => {
      cleanup();
      connecting = null;
      reject(new Error("rate-limit redis connect timed out"));
    }, CONNECT_TIMEOUT_MS);
    const cleanup = (): void => {
      clearTimeout(timer);
      rateLimitRedis.off("ready", onReady);
    };
    rateLimitRedis.once("ready", onReady);
    rateLimitRedis.connect().catch(() => {});
  });
  return connecting;
};

const keyByUserOrIp = (req: Request): string => {
  if (req.userId) return req.userId;
  return req.ip ? ipKeyGenerator(req.ip) : "anonymous";
};

const createStore = (prefix: string): RedisStore =>
  new RedisStore({
    sendCommand: async (...args: string[]) => {
      await ensureReady();
      return rateLimitRedis.call(
        ...(args as [string, ...string[]]),
      ) as Promise<never>;
    },
    prefix,
  });

export const generalLimiter = rateLimit({
  windowMs: RATE_LIMITS.windowMs,
  limit: RATE_LIMITS.generalMax,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skip: (req) => req.path.startsWith("/health"),
  passOnStoreError: true,
  store: createStore("rl-general"),
});

/**
 * Strict bucket keyed per authenticated user for expensive AI generation
 * endpoints (chat, flashcards, summaries, ingestion).
 */
export const aiLimiter = rateLimit({
  windowMs: RATE_LIMITS.windowMs,
  limit: RATE_LIMITS.aiMax,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyByUserOrIp,
  passOnStoreError: true,
  store: createStore("rl-ai"),
});
