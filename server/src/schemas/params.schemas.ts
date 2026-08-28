import { z } from "zod";

export const idParamSchema = z.object({
  id: z.string().uuid("id must be a valid identifier"),
});

export type IdParam = z.infer<typeof idParamSchema>;

export const deckIdParamSchema = idParamSchema.extend({
  deckId: z.string().uuid("deckId must be a valid identifier"),
});

export type DeckIdParam = z.infer<typeof deckIdParamSchema>;
