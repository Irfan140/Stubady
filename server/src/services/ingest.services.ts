import {
  CHUNK_OVERLAP,
  CHUNK_SIZE,
  EMBED_BATCH_SIZE,
  MAX_CHUNKS,
  SOURCE_STATUSES,
} from "../constants/sources.constants";
import { logger } from "../config/logger";
import { embeddingModel } from "../lib/ai";
import {
  deleteChunksBySourceId,
  insertChunks,
} from "../repositories/source-chunks.repositories";
import {
  claimSourceForProcessing,
  findSourceForUser,
  updateSource,
  type SourceRecord,
} from "../repositories/sources.repositories";
import { HttpError } from "../utils/http-error.utils";
import { extractPdfText } from "./pdf.services";
import { fetchWebText } from "./web.services";

export const chunkText = (text: string): string[] => {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const chunks: string[] = [];
  let start = 0;
  while (start < normalized.length) {
    const end = Math.min(start + CHUNK_SIZE, normalized.length);
    chunks.push(normalized.slice(start, end));
    if (end === normalized.length) break;
    start = end - CHUNK_OVERLAP;
  }
  return chunks;
};

const resolveSourceText = async (source: SourceRecord): Promise<string> => {
  switch (source.type) {
    case "pdf": {
      if (!source.storage_path)
        throw new Error("Storage path is required for PDF sources");
      return extractPdfText(source.storage_path);
    }
    case "note":
      return source.content ?? "";
    case "web": {
      if (source.fetched_content) return source.fetched_content;
      if (!source.url) throw new Error("Web source missing url");
      const text = await fetchWebText(source.url);
      await updateSource(source.id, { fetched_content: text });
      return text;
    }
    default:
      throw new Error(`Unknown source type: ${source.type}`);
  }
};

const embedInBatches = async (chunks: string[]): Promise<number[][]> => {
  const vectors: number[][] = [];
  for (let start = 0; start < chunks.length; start += EMBED_BATCH_SIZE) {
    const batch = await embeddingModel.embedDocuments(
      chunks.slice(start, start + EMBED_BATCH_SIZE),
    );
    vectors.push(...batch);
  }
  return vectors;
};

const markFailed = async (sourceId: string, message: string): Promise<void> => {
  await updateSource(sourceId, {
    status: SOURCE_STATUSES.failed,
    error_message: message,
  });
};

/**
 * Extracts text from a source, chunks it, embeds it, and stores the chunks.
 * Marks the source failed when processing errors occur.
 */
export const ingestSource = async (
  sourceId: string,
  userId: string,
): Promise<{ chunkCount: number }> => {
  const source = await findSourceForUser(sourceId, userId);
  if (!source) {
    throw new HttpError(404, "Source not found");
  }

  const claimed = await claimSourceForProcessing(sourceId, userId);
  if (!claimed) {
    throw new HttpError(409, "Source is already being processed");
  }

  try {
    const text = await resolveSourceText(source);
    let chunks = chunkText(text);

    if (chunks.length === 0) {
      await markFailed(sourceId, "No extractable text found in source");
      throw new HttpError(422, "No extractable text found in source");
    }

    if (chunks.length > MAX_CHUNKS) {
      logger.warn(
        { sourceId, chunkCount: chunks.length, maxChunks: MAX_CHUNKS },
        "source exceeds chunk cap; ingesting first chunks only",
      );
      chunks = chunks.slice(0, MAX_CHUNKS);
    }

    const embeddings = await embedInBatches(chunks);

    await deleteChunksBySourceId(sourceId);

    await insertChunks(
      chunks.map((content, index) => ({
        source_id: sourceId,
        chunk_index: index,
        content,
        embedding: JSON.stringify(embeddings[index]),
        token_count: Math.ceil(content.length / 4),
      })),
    );

    await updateSource(sourceId, {
      status: SOURCE_STATUSES.ready,
      error_message: null,
    });

    return { chunkCount: chunks.length };
  } catch (err) {
    if (!(err instanceof HttpError)) {
      await markFailed(
        sourceId,
        err instanceof Error ? err.message : "Processing failed",
      );
    }
    throw err;
  }
};
