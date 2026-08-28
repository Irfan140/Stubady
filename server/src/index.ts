import { env } from "./config/env";
import { logger } from "./config/logger";
import { app } from "./app";
import { prisma } from "./lib/prisma";
import { endAllStreams } from "./lib/stream-registry";
import { rateLimitRedis } from "./middlewares/rate-limits.middlewares";
import { closeIngestionQueue } from "./queues/ingestion.queues";
import { startIngestionWorker } from "./workers/ingestion.workers";

const ingestionWorker = startIngestionWorker();

const server = app.listen(env.port, () => {
  logger.info(`Server is running on port ${env.port}`);
});

const FORCE_EXIT_MS = 10_000;

/**
 * Graceful shutdown: stop accepting new connections, drain background work,
 * then close every client (worker, queue, rate-limit Redis, Prisma).
 */
const shutdown = async (signal: string): Promise<void> => {
  logger.info({ signal }, "shutdown initiated");

  // Safety net: never hang forever (e.g. a stuck keep-alive socket).
  const forceExit = setTimeout(() => {
    logger.warn("shutdown timed out; forcing exit");
    process.exit(0);
  }, FORCE_EXIT_MS);
  forceExit.unref();

  endAllStreams();

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });

  await Promise.allSettled([
    ingestionWorker.close(),
    closeIngestionQueue(),
    rateLimitRedis.quit(),
    prisma.$disconnect(),
  ]);

  logger.info("shutdown complete");
  process.exit(0);
};

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
process.on("SIGINT", () => {
  void shutdown("SIGINT");
});
process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "unhandled promise rejection");
});
process.on("uncaughtException", (err) => {
  logger.fatal(err, "uncaught exception");
  process.exit(1);
});
