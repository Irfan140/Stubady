import type { Request, Response } from "express";

import { prisma } from "../lib/prisma";
import { rateLimitRedis } from "../middlewares/rate-limits.middlewares";
import { pingIngestionQueue } from "../queues/ingestion.queues";

/** Liveness: process is up. Unauthenticated by design. */
export const checkLiveness = (_req: Request, res: Response): void => {
  res.json({ status: "ok" });
};

/** Readiness: database, Redis, and the ingestion queue are all reachable. */
export const checkReadiness = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  let database = "up";
  let redis = "up";
  let queue = "up";

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

  try {
    await pingIngestionQueue();
  } catch {
    queue = "down";
  }

  const ok = database === "up" && redis === "up" && queue === "up";
  res
    .status(ok ? 200 : 503)
    .json({ status: ok ? "ok" : "degraded", database, redis, queue });
};
