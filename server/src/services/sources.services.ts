import { randomUUID } from "node:crypto";

import {
  SOURCE_STATUSES,
  SOURCE_TYPES,
  STALE_PROCESSING_MS,
} from "../config/constants";
import { R2_UPLOAD_EXPIRES_SECONDS } from "../lib/r2";
import { logger } from "../config/logger";
import {
  createPdfUploadUrl,
  deleteObject,
  headObject,
  MAX_PDF_SIZE_BYTES,
} from "../lib/r2";
import { enqueueIngestionJob } from "../queues/ingestion.queues";
import {
  createSource as persistSource,
  deleteSourceForUser,
  findSourceForUser,
  listSourcesForUser,
  updateSource,
  type SourceRecord,
} from "../repositories/sources.repositories";
import type { CreateSourceInput } from "../schemas/sources.schemas";
import type { CreatePdfUploadInput } from "../schemas/sources.schemas";
import { HttpError } from "../utils/http-error.utils";
import {
  paginate,
  type Paginated,
  type Pagination,
} from "../utils/pagination.utils";
import { getStudySetOrThrow } from "./study-sets.services";

export const createSource = async (
  userId: string,
  input: CreateSourceInput,
): Promise<SourceRecord & { jobId: string | undefined }> => {
  await getStudySetOrThrow(input.studySetId, userId);

  const record =
    input.type === SOURCE_TYPES.note
      ? await persistSource({
          userId,
          studySetId: input.studySetId,
          type: input.type,
          content: input.content,
        })
      : await persistSource({
          userId,
          studySetId: input.studySetId,
          type: input.type,
          url: input.url,
        });

  try {
    const { jobId } = await enqueueIngestionJob({
      sourceId: record.id,
      userId,
    });
    return { ...record, jobId };
  } catch (err) {
    logger.error({ err, sourceId: record.id }, "failed to enqueue ingestion");
    await updateSource(record.id, {
      status: SOURCE_STATUSES.failed,
      error_message: "Queue unavailable; retry processing",
    });
    return { ...record, jobId: undefined };
  }
};

const pdfStorageKey = (userId: string, studySetId: string): string =>
  `users/${userId}/study-sets/${studySetId}/sources/${randomUUID()}.pdf`;

export const createPdfUpload = async (
  userId: string,
  input: CreatePdfUploadInput,
): Promise<{
  source: SourceRecord;
  uploadUrl: string;
  expiresIn: number;
}> => {
  await getStudySetOrThrow(input.studySetId, userId);

  if (input.size > MAX_PDF_SIZE_BYTES) {
    throw new HttpError(413, "PDF must be 25 MB or smaller");
  }

  const storagePath = pdfStorageKey(userId, input.studySetId);
  const source = await persistSource({
    userId,
    studySetId: input.studySetId,
    type: SOURCE_TYPES.pdf,
    storagePath,
  });
  const uploadUrl = await createPdfUploadUrl({
    key: storagePath,
  });

  return { source, uploadUrl, expiresIn: R2_UPLOAD_EXPIRES_SECONDS };
};

export const completePdfUpload = async (
  userId: string,
  sourceId: string,
): Promise<{ source: SourceRecord; jobId: string | undefined }> => {
  const source = await getSource(userId, sourceId);
  if (source.type !== SOURCE_TYPES.pdf || !source.storage_path) {
    throw new HttpError(400, "Source is not a PDF upload");
  }
  if (source.status !== SOURCE_STATUSES.pending) {
    throw new HttpError(409, "PDF upload has already been completed");
  }

  let metadata;
  try {
    metadata = await headObject(source.storage_path);
  } catch {
    throw new HttpError(422, "PDF upload was not found in storage");
  }

  if (!metadata.ContentLength || metadata.ContentLength > MAX_PDF_SIZE_BYTES) {
    throw new HttpError(
      422,
      "Uploaded PDF is empty or exceeds the 25 MB limit",
    );
  }
  if (metadata.ContentType && metadata.ContentType !== "application/pdf") {
    throw new HttpError(422, "Uploaded object is not a PDF");
  }

  try {
    const { jobId } = await enqueueIngestionJob({ sourceId, userId });
    return { source: await getSource(userId, sourceId), jobId };
  } catch (err) {
    logger.error({ err, sourceId }, "failed to enqueue PDF ingestion");
    await updateSource(sourceId, {
      status: SOURCE_STATUSES.failed,
      error_message: "Queue unavailable; retry processing",
    });
    return { source: await getSource(userId, sourceId), jobId: undefined };
  }
};

export const listSources = async (
  userId: string,
  query: { studySetId: string } & Pagination,
): Promise<Paginated<SourceRecord>> => {
  await getStudySetOrThrow(query.studySetId, userId);
  const rows = await listSourcesForUser(query.studySetId, userId, {
    limit: query.limit,
    offset: query.offset,
  });
  return paginate(rows, query.offset, query.limit);
};

export const getSource = async (
  userId: string,
  sourceId: string,
): Promise<SourceRecord> => {
  const source = await findSourceForUser(sourceId, userId);
  if (!source) throw new HttpError(404, "Source not found");
  return source;
};

export const deleteSource = async (
  userId: string,
  sourceId: string,
): Promise<void> => {
  const source = await getSource(userId, sourceId);
  if (source.storage_path) await deleteObject(source.storage_path);
  const deleted = await deleteSourceForUser(sourceId, userId);
  if (!deleted) throw new HttpError(404, "Source not found");
};

export const retryProcessing = async (
  userId: string,
  sourceId: string,
): Promise<{ jobId: string | undefined }> => {
  const source = await getSource(userId, sourceId);
  const staleProcessing =
    source.status === SOURCE_STATUSES.processing &&
    Date.now() - source.updated_at.getTime() > STALE_PROCESSING_MS;
  const retryable =
    source.status === SOURCE_STATUSES.pending ||
    source.status === SOURCE_STATUSES.failed ||
    staleProcessing;
  if (!retryable) {
    throw new HttpError(
      409,
      "Only pending, failed, or stalled sources can be retried",
    );
  }
  try {
    return await enqueueIngestionJob({ sourceId: source.id, userId });
  } catch (err) {
    logger.error({ err, sourceId }, "failed to enqueue retry ingestion");
    throw new HttpError(503, "Queue unavailable; please try again in a moment");
  }
};
