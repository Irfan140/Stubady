import { Router } from "express";

import { prisma } from "../lib/prisma";
import { rateLimitRedis } from "../middlewares/rate-limits.middlewares";
import { isIngestionWorkerReady } from "../workers/ingestion.workers";

export const healthRouter = Router();

/** Liveness: process is up. Unauthenticated by design. */
healthRouter.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

/** Readiness: database and Redis are both reachable. */
healthRouter.get("/health/ready", async (_req, res) => {
  let database = "up";
  let redis = "up";
  const worker = isIngestionWorkerReady() ? "up" : "down";

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    database = "down";
  }

  try {
    if (rateLimitRedis.status === "ready") {
      await rateLimitRedis.ping();
    } else {
      redis = "down";
    }
  } catch {
    redis = "down";
  }

  const ok = database === "up" && redis === "up" && worker === "up";
  res
    .status(ok ? 200 : 503)
    .json({ status: ok ? "ok" : "degraded", database, redis, worker });
});
