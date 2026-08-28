import { SOURCE_STATUSES, STALE_PROCESSING_MS } from "../config/constants";
import { prisma } from "../lib/prisma";

export type SourceType = "pdf" | "note" | "web";

export type SourceRecord = {
  id: string;
  type: SourceType;
  content: string | null;
  storage_path: string | null;
  url: string | null;
  fetched_content: string | null;
  status: string;
  error_message: string | null;
  updated_at: Date;
};

export type SourceUpdate = {
  status?: string;
  error_message?: string | null;
  fetched_content?: string;
};

const toSourceRecord = (row: {
  id: string;
  type: string;
  content: string | null;
  storagePath: string | null;
  url: string | null;
  fetchedContent: string | null;
  status: string;
  errorMessage: string | null;
  updatedAt: Date;
}): SourceRecord => ({
  id: row.id,
  type: row.type as SourceType,
  content: row.content,
  storage_path: row.storagePath,
  url: row.url,
  fetched_content: row.fetchedContent,
  status: row.status,
  error_message: row.errorMessage,
  updated_at: row.updatedAt,
});

export const findSourceForUser = async (
  sourceId: string,
  userId: string,
): Promise<SourceRecord | null> => {
  const row = await prisma.source.findFirst({
    where: { id: sourceId, userId },
  });

  if (!row) return null;
  return toSourceRecord(row);
};

export const createSource = async (input: {
  userId: string;
  studySetId: string;
  type: SourceType;
  content?: string | null;
  url?: string | null;
  storagePath?: string | null;
}): Promise<SourceRecord> => {
  const row = await prisma.source.create({
    data: {
      userId: input.userId,
      studySetId: input.studySetId,
      type: input.type,
      content: input.content ?? null,
      url: input.url ?? null,
      storagePath: input.storagePath ?? null,
      status: SOURCE_STATUSES.pending,
    },
  });
  return toSourceRecord(row);
};

export const listSourcesForUser = async (
  studySetId: string,
  userId: string,
  pagination: { limit: number; offset: number },
): Promise<SourceRecord[]> => {
  const rows = await prisma.source.findMany({
    where: { studySetId, userId },
    orderBy: { createdAt: "desc" },
    take: pagination.limit + 1,
    skip: pagination.offset,
  });
  return rows.map(toSourceRecord);
};

export const deleteSourceForUser = async (
  sourceId: string,
  userId: string,
): Promise<boolean> => {
  const res = await prisma.source.deleteMany({
    where: { id: sourceId, userId },
  });
  return res.count > 0;
};

/**
 * Optimistic lock against concurrent ingestion: flips the status to
 * `processing` only when it is not already processing. A `processing` row
 * older than STALE_PROCESSING_MS is treated as an abandoned claim and can be
 * reclaimed (handles worker crashes between claim and completion/failure).
 */
export const claimSourceForProcessing = async (
  sourceId: string,
  userId: string,
): Promise<boolean> => {
  const staleBefore = new Date(Date.now() - STALE_PROCESSING_MS);

  const res = await prisma.source.updateMany({
    where: {
      id: sourceId,
      userId,
      OR: [
        { status: { not: SOURCE_STATUSES.processing } },
        { status: SOURCE_STATUSES.processing, updatedAt: { lt: staleBefore } },
      ],
    },
    data: { status: SOURCE_STATUSES.processing, errorMessage: null },
  });
  return res.count > 0;
};

export const updateSource = async (
  sourceId: string,
  patch: SourceUpdate,
): Promise<void> => {
  await prisma.source.update({
    where: { id: sourceId },
    data: {
      status: patch.status,
      errorMessage: patch.error_message,
      fetchedContent: patch.fetched_content,
    },
  });
};

export const listReadySourceIds = async (
  studySetId: string,
): Promise<string[]> => {
  const rows = await prisma.source.findMany({
    where: { studySetId, status: "ready" },
    select: { id: true },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  return rows.map((row) => row.id);
};
