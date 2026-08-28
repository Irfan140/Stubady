import { randomUUID } from "node:crypto";

import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../lib/prisma";

export type MatchedChunk = {
  id: string;
  content: string;
  similarity: number;
};

export type SourceChunkInsert = {
  source_id: string;
  chunk_index: number;
  content: string;
  embedding: string;
  token_count: number;
};

export const deleteChunksBySourceId = async (
  sourceId: string,
): Promise<void> => {
  await prisma.sourceChunk.deleteMany({ where: { sourceId } });
};

/**
 * Bulk-inserts chunks including their pgvector embeddings. The embedding
 * column is a native `vector` type unsupported by the Prisma query builder,
 * so rows are written through parameterized SQL inside one transaction.
 * Embeddings arrive as text literals: "[0.12,-0.33,...]".
 */
export const insertChunks = async (
  rows: SourceChunkInsert[],
): Promise<void> => {
  if (rows.length === 0) return;

  // Single multi-row statement — far cheaper than N round-trips for large PDFs.
  const values = Prisma.join(
    rows.map(
      (row) =>
        Prisma.sql`(${randomUUID()}::uuid, ${row.source_id}::uuid, ${row.chunk_index}, ${row.content}, ${row.embedding}::vector, ${row.token_count})`,
    ),
  );

  await prisma.$executeRaw`
    INSERT INTO "source_chunks"
      ("id", "source_id", "chunk_index", "content", "embedding", "token_count")
    VALUES ${values}
  `;
};

/**
 * Vector similarity search backed by the `match_source_chunks` SQL function
 * (pgvector cosine distance, `<=>`).
 */
export const matchSourceChunks = async (params: {
  queryEmbedding: string;
  studySetId: string;
  matchCount: number;
}): Promise<MatchedChunk[]> =>
  prisma.$queryRaw<MatchedChunk[]>`
    SELECT c.id::text AS id,
           c.content,
           (1 - (c.embedding <=> ${params.queryEmbedding}::vector)) AS similarity
    FROM source_chunks c
    JOIN sources s ON s.id = c.source_id
    WHERE s.study_set_id = ${params.studySetId}::uuid
      AND c.embedding IS NOT NULL
    ORDER BY c.embedding <=> ${params.queryEmbedding}::vector
    LIMIT ${params.matchCount}
  `;

export const listChunksBySourceIds = async (
  sourceIds: string[],
): Promise<Array<{ content: string; chunk_index: number }>> => {
  const rows = await prisma.sourceChunk.findMany({
    where: { sourceId: { in: sourceIds } },
    select: { sourceId: true, content: true, chunkIndex: true },
  });

  const sourceOrder = new Map(
    sourceIds.map((sourceId, index) => [sourceId, index]),
  );
  rows.sort(
    (a, b) =>
      (sourceOrder.get(a.sourceId) ?? Number.MAX_SAFE_INTEGER) -
        (sourceOrder.get(b.sourceId) ?? Number.MAX_SAFE_INTEGER) ||
      a.chunkIndex - b.chunkIndex,
  );

  return rows.map((row) => ({
    content: row.content,
    chunk_index: row.chunkIndex,
  }));
};
