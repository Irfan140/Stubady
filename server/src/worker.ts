import { logger } from "./config/logger";
import { FORCE_EXIT_MS } from "./constants/shutdown.constants";
import { prisma } from "./lib/prisma";
import { closeIngestionQueue } from "./queues/ingestion.queues";
import { startIngestionWorker } from "./workers/ingestion.workers";

/**
 * Standalone ingestion worker entrypoint (`bun run src/worker.ts`).
 * Runs the BullMQ background worker in its own OS process, separate from
 * the API (`src/index.ts`), so a crashing or memory-heavy ingestion job
 * cannot take the API down with it — and each side scales independently.
 * Both processes share PostgreSQL + Redis and are safe to run side by side.
 */
const ingestionWorker = startIngestionWorker();

logger.info("Ingestion worker started");

/**
 * Graceful shutdown: stop taking new jobs, let the in-flight job finish,
 * then close every client (worker, queue, Prisma).
 */
const shutdown = async (signal: string): Promise<void> => {
  logger.info({ signal }, "worker shutdown initiated");

  // Safety net: never hang forever (e.g. a stuck provider socket).
  const forceExit = setTimeout(() => {
    logger.warn("worker shutdown timed out; forcing exit");
    process.exit(0);
  }, FORCE_EXIT_MS);
  forceExit.unref();

  await Promise.allSettled([
    ingestionWorker.close(),
    closeIngestionQueue(),
    prisma.$disconnect(),
  ]);

  logger.info("worker shutdown complete");
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
