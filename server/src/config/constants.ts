/**
 * Shared domain constants — single source of truth for magic strings,
 * statuses, queue names, and tuning knobs.
 */

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

export const CHAT_ROLES = {
  user: "user",
  assistant: "assistant",
} as const;

export const PROMPT_VERSIONS = {
  summary: "summary-v1",
  flashcards: "flashcards-v1",
  chat: "chat-v1",
} as const;

/** A `processing` source older than this is considered a stale/stuck claim. */
export const STALE_PROCESSING_MS = 5 * 60 * 1000;

export const QUEUE_NAMES = {
  ingestion: "ingestion",
} as const;

export const JOB_NAMES = {
  processSource: "process-source",
} as const;

export const RAG_DEFAULTS = {
  matchCount: 8,
  maxChars: 24000,
} as const;

export const TOKEN_CHARS_PER_TOKEN = 4;

export const CHAT_LIMITS = {
  historyMessages: 10,
  maxHistoryTokens: 1500,
  maxContextTokens: 6000,
} as const;

export const RATE_LIMITS = {
  windowMs: 60_000,
  generalMax: 120,
  aiMax: 10,
} as const;

export const PROVIDER_TIMEOUTS = {
  firecrawlMs: 45_000,
  openAiMs: 60_000,
  r2Ms: 60_000,
} as const;
