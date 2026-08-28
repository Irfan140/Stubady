import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";

import { env } from "../config/env";
import { PROVIDER_TIMEOUTS } from "../config/constants";

const EMBEDDING_MODEL_DIMENSIONS: Record<string, number> = {
  "text-embedding-3-small": 1536,
  "text-embedding-3-large": 3072,
};

const expectedDims = EMBEDDING_MODEL_DIMENSIONS[env.embeddingModel];
if (!expectedDims || expectedDims !== 1536) {
  throw new Error(
    `Unsupported embedding model "${env.embeddingModel}": the schema and ` +
      `match_source_chunks function are built for 1536 dimensions.`,
  );
}

/**
 * Default chat model (provider-default temperature).
 * Used for RAG chat replies and study summaries.
 */
export const chatModel = new ChatOpenAI({
  apiKey: env.openaiApiKey,
  model: env.chatModel,
  temperature: 0,
  timeout: PROVIDER_TIMEOUTS.openAiMs,
  maxRetries: 2,
});

export const flashcardModel = new ChatOpenAI({
  apiKey: env.openaiApiKey,
  model: env.chatModel,
  temperature: 0.1,
  timeout: PROVIDER_TIMEOUTS.openAiMs,
  maxRetries: 2,
});

export const embeddingModel = new OpenAIEmbeddings({
  apiKey: env.openaiApiKey,
  modelName: env.embeddingModel,
  timeout: PROVIDER_TIMEOUTS.openAiMs,
  maxRetries: 2,
});

export const chatModelId = env.chatModel;
