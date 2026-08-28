import { Queue } from "bullmq";
import Redis from "ioredis";

import { JOB_NAMES, QUEUE_NAMES } from "../config/constants";
import { env } from "../config/env";

export type IngestionJobData = {
  sourceId: string;
  userId: string;
};

const connection = new Redis(env.redisUrl, { maxRetriesPerRequest: null });

export const ingestionQueue = new Queue<IngestionJobData>(
  QUEUE_NAMES.ingestion,
  { connection },
);

/**
 * Enqueues background ingestion (extract → chunk → embed → store) for a
 * source. Retries transient failures (network/API) with exponential backoff.
 */
export const enqueueIngestionJob = async (
  data: IngestionJobData,
): Promise<{ jobId: string | undefined }> => {
  const job = await ingestionQueue.add(JOB_NAMES.processSource, data, {
    attempts: 3,
    backoff: { type: "exponential", delay: 5_000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  });
  return { jobId: job.id };
};

export const closeIngestionQueue = async (): Promise<void> => {
  await ingestionQueue.close();
  await connection.quit();
};
