/** Source lifecycle, types, and ingestion tuning. */

export const SOURCE_STATUSES = {
  pending: "pending",
  processing: "processing",
  ready: "ready",
  failed: "failed",
} as const;

export const SOURCE_TYPES = {
  pdf: "pdf",
  note: "note",
  web: "web",
} as const;

/** A `processing` source older than this is considered a stale/stuck claim. */
export const STALE_PROCESSING_MS = 5 * 60 * 1000;

export const MAX_PDF_SIZE_BYTES = 25 * 1024 * 1024;

export const CHUNK_SIZE = 2000;
export const CHUNK_OVERLAP = 200;
// One embedding request per batch: a whole-PDF request risks OpenAI
// 429s/timeouts and balloons worker memory on large documents.
export const EMBED_BATCH_SIZE = 100;
// Hard ceiling per source so a pathological document can't wedge the worker
// (or the OpenAI bill). Excess content is skipped with a warning.
export const MAX_CHUNKS = 2000;
