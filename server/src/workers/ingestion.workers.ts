import Redis from "ioredis";
import { Worker } from "bullmq";

import {
  QUEUE_NAMES,
  SOURCE_STATUSES,
  STALE_PROCESSING_MS,
} from "../config/constants";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { processIngestionJob } from "../processors/ingestion.processors";
import {
  findSourceForUser,
  updateSource,
} from "../repositories/sources.repositories";
import type { IngestionJobData } from "../queues/ingestion.queues";

export type IngestionWorkerHandle = {
  close: () => Promise<void>;
};

let workerReady = false;

export const isIngestionWorkerReady = (): boolean => workerReady;

/**
 * Starts the background ingestion worker (own connection — BullMQ workers
 * block on their connection and must not share one with enqueuers).
 */
export const startIngestionWorker = (): IngestionWorkerHandle => {
  const connection = new Redis(env.redisUrl, { maxRetriesPerRequest: null });

  const worker = new Worker<IngestionJobData>(
    QUEUE_NAMES.ingestion,
    processIngestionJob,
    { connection, concurrency: 2 },
  );

  workerReady = false;
  connection.on("ready", () => {
    workerReady = true;
  });
  connection.on("close", () => {
    workerReady = false;
  });

  worker.on("failed", (job, err) => {
    logger.error(
      { jobId: job?.id, sourceId: job?.data.sourceId, err },
      "ingestion job failed",
    );

    if (!job || job.attemptsMade < (job.opts.attempts ?? 1)) return;

    void (async () => {
      const source = await findSourceForUser(
        job.data.sourceId,
        job.data.userId,
      );
      const staleProcessing =
        source?.status === SOURCE_STATUSES.processing &&
        Date.now() - source.updated_at.getTime() > STALE_PROCESSING_MS;

      if (
        source &&
        (source.status === SOURCE_STATUSES.pending || staleProcessing)
      ) {
        await updateSource(source.id, {
          status: SOURCE_STATUSES.failed,
          error_message: "Ingestion job failed after all retries",
        });
      }
    })().catch((failure) => {
      logger.error(
        { err: failure, sourceId: job.data.sourceId },
        "failed to update exhausted ingestion source",
      );
    });
  });
  worker.on("error", (err) => {
    logger.error({ err }, "ingestion worker error");
  });

  const close = async (): Promise<void> => {
    workerReady = false;
    await worker.close();
    await connection.quit();
  };

  return { close };
};
