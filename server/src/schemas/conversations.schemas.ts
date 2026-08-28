import { z } from "zod";

export const createConversationSchema = z.object({
  studySetId: z.string().uuid(),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;

export const listConversationsQuerySchema = z.object({
  studySetId: z.string().uuid(),
  limit: z.string().optional(),
  cursor: z.string().optional(),
});

export const listMessagesQuerySchema = z.object({
  limit: z.string().optional(),
  cursor: z.string().optional(),
  // `desc` returns the newest page first (offset cursor walks back in time).
  order: z.enum(["asc", "desc"]).default("asc"),
});

export type ListMessagesQuery = z.infer<typeof listMessagesQuerySchema>;
