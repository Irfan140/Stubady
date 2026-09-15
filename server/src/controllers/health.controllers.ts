import type { Request, Response } from "express";

import { prisma } from "../lib/prisma";
import { rateLimitRedis } from "../middlewares/rate-limits.middlewares";
import { isIngestionWorkerReady } from "../workers/ingestion.workers";

/** Liveness: process is up. Unauthenticated by design. */
export const checkLiveness = (_req: Request, res: Response): void => {
  res.json({ status: "ok" });
};

/** Readiness: database and Redis are both reachable. */
export const checkReadiness = async (
  _req: Request,
  res: Response,
): Promise<void> => {
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
};
