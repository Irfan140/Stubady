import type { Job } from "bullmq";

import { logger } from "../config/logger";
import { ingestSource } from "../services/ingest.services";
import type { IngestionJobData } from "../queues/ingestion.queues";

export const processIngestionJob = async (
  job: Job<IngestionJobData>,
): Promise<{ chunkCount: number }> => {
  const { sourceId, userId } = job.data;
  logger.info({ jobId: job.id, sourceId }, "processing ingestion job");

  const result = await ingestSource(sourceId, userId);

  logger.info(
    { jobId: job.id, sourceId, chunkCount: result.chunkCount },
    "ingestion job completed",
  );
  return { chunkCount: result.chunkCount };
};
