import { z } from "zod";

/** Body for POST /conversations/:id/chat */
export const chatMessageSchema = z.object({
  // ~2k tokens ceiling: prevents oversized prompts as a cost/DoS vector.
  message: z.string().trim().min(1, "message is required").max(8_000),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
