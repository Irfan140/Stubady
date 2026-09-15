import { Router } from "express";

import {
  generateFlashcards,
  getDeck,
  listDecks,
} from "../controllers/flashcards.controllers";
import { aiLimiter } from "../middlewares/rate-limits.middlewares";
import { validate } from "../middlewares/validate.middlewares";
import { generateFlashcardsInputSchema } from "../schemas/flashcards.schemas";
import { deckIdParamSchema, idParamSchema } from "../schemas/params.schemas";

export const flashcardsRouter = Router();
flashcardsRouter.post(
  "/:id/flashcards",
  aiLimiter,
  validate(idParamSchema, "params"),
  validate(generateFlashcardsInputSchema),
  generateFlashcards,
);
flashcardsRouter.get(
  "/:id/decks",
  validate(idParamSchema, "params"),
  listDecks,
);
flashcardsRouter.get(
  "/:id/decks/:deckId",
  validate(deckIdParamSchema, "params"),
  getDeck,
);
