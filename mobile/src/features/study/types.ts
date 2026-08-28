import { z } from "zod";

export const studySetSchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.coerce.date().optional(),
});
export const sourceSchema = z.object({
  id: z.string(),
  type: z.enum(["pdf", "note", "web"]),
  content: z.string().nullable(),
  storage_path: z.string().nullable(),
  url: z.string().nullable(),
  fetched_content: z.string().nullable(),
  status: z.enum(["pending", "processing", "ready", "failed"]),
  error_message: z.string().nullable(),
  updated_at: z.coerce.date().optional(),
});
export const summarySchema = z.object({
  id: z.string(),
  content: z.string(),
  model: z.string().optional(),
  promptVersion: z.string().optional(),
  createdAt: z.coerce.date().optional(),
});
export const deckSchema = z.object({
  id: z.string(),
  title: z.string(),
  cardCount: z.number(),
  createdAt: z.coerce.date().optional(),
});
export const deckWithCardsSchema = z.object({
  id: z.string(),
  title: z.string(),
  cards: z.array(
    z.object({
      id: z.string(),
      front: z.string(),
      back: z.string(),
      sortOrder: z.number(),
    }),
  ),
});
export const messageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  createdAt: z.coerce.date().optional(),
});
export const conversationSchema = z.object({
  id: z.string(),
  study_set_id: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});
export const summaryResultSchema = z.object({
  id: z.string(),
  content: z.string(),
});
export const flashcardResultSchema = z.object({
  deckId: z.string(),
  cards: z.array(z.object({ front: z.string(), back: z.string() })),
});
export const chatSourceSchema = z.object({
  id: z.string(),
  content: z.string(),
  similarity: z.number(),
});
export const chatResultSchema = z.object({
  reply: z.string(),
  sources: z.array(chatSourceSchema).optional(),
});
export const pdfUploadSessionSchema = z.object({
  source: sourceSchema,
  uploadUrl: z.string().url(),
  expiresIn: z.number().int().positive(),
});
export const pdfUploadCompleteSchema = z.object({
  source: sourceSchema,
  jobId: z.string().optional(),
  status: z.literal("queued"),
});

export type StudySet = z.infer<typeof studySetSchema>;
export type Source = z.infer<typeof sourceSchema>;
export type Summary = z.infer<typeof summarySchema>;
export type Deck = z.infer<typeof deckSchema>;
export type DeckWithCards = z.infer<typeof deckWithCardsSchema>;
export type Message = z.infer<typeof messageSchema>;
export type Conversation = z.infer<typeof conversationSchema>;
export type ChatStreamEvent =
  | { type: "token"; text: string }
  | { type: "sources"; sources: z.infer<typeof chatSourceSchema>[] }
  | {
      type: "done";
      reply: string;
      sources: z.infer<typeof chatSourceSchema>[];
    };
export type Page<T> = { data: T[]; nextCursor: string | null };
export type PdfUploadSession = z.infer<typeof pdfUploadSessionSchema>;
