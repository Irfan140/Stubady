import { z } from "zod";

export const FLASHCARD_COUNT_DEFAULT = 12;
export const FLASHCARD_COUNT_LIMIT = 20;

/** Body for POST /study-sets/:id/flashcards */
export const generateFlashcardsInputSchema = z.object({
  count: z.coerce
    .number()
    .int("count must be an integer")
    .min(1, "count must be at least 1")
    .max(
      FLASHCARD_COUNT_LIMIT,
      `count must be at most ${FLASHCARD_COUNT_LIMIT}`,
    )
    .optional(),
});

export type GenerateFlashcardsInput = z.infer<
  typeof generateFlashcardsInputSchema
>;

/** A single flashcard as produced by the model. */
export const flashcardSchema = z.object({
  front: z.string().min(1),
  back: z.string().min(1),
});

export type Flashcard = z.infer<typeof flashcardSchema>;

/** Contract enforced on the model's JSON output, bounded by the requested count. */
export const buildFlashcardsOutputSchema = (count: number) =>
  z.object({
    cards: z.array(flashcardSchema).min(1).max(count),
  });
