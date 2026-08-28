import { embeddingModel } from "../lib/ai";
import {
  listChunksBySourceIds,
  matchSourceChunks,
  type MatchedChunk,
} from "../repositories/source-chunks.repositories";
import { listReadySourceIds } from "../repositories/sources.repositories";

export type { MatchedChunk };

export const retrieveContext = async (
  studySetId: string,
  query: string,
  matchCount = 8,
): Promise<MatchedChunk[]> => {
  const vector = await embeddingModel.embedQuery(query);

  return matchSourceChunks({
    queryEmbedding: JSON.stringify(vector),
    studySetId,
    matchCount,
  });
};

export const getStudySetText = async (
  studySetId: string,
  maxChars = 24000,
): Promise<string> => {
  const sourceIds = await listReadySourceIds(studySetId);
  if (sourceIds.length === 0) return "";

  const chunks = await listChunksBySourceIds(sourceIds);

  let text = "";
  for (const chunk of chunks) {
    if (text.length + chunk.content.length > maxChars) break;
    text += chunk.content + "\n\n";
  }
  return text.trim();
};
