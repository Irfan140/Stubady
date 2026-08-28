import { Router } from "express";

import { aiLimiter } from "../middlewares/rate-limits.middlewares";
import { validate } from "../middlewares/validate.middlewares";
import { generateFlashcardsInputSchema } from "../schemas/flashcards.schemas";
import { deckIdParamSchema, idParamSchema } from "../schemas/params.schemas";
import {
  generateFlashcards,
  getDeck,
  listDecks,
} from "../services/flashcards.services";
import { parsePagination } from "../utils/pagination.utils";

export const flashcardsRouter = Router();
flashcardsRouter.post(
  "/:id/flashcards",
  aiLimiter,
  validate(idParamSchema, "params"),
  validate(generateFlashcardsInputSchema),
  async (req, res) => {
    const { deckId, cards } = await generateFlashcards(
      req.userId!,
      req.params.id as string,
      req.body,
    );
    res.status(201).json({ deckId, cards });
  },
);
flashcardsRouter.get(
  "/:id/decks",
  validate(idParamSchema, "params"),
  async (req, res) => {
    const result = await listDecks(
      req.userId!,
      req.params.id as string,
      parsePagination(req.query as { limit?: string; cursor?: string }),
    );
    res.json(result);
  },
);
flashcardsRouter.get(
  "/:id/decks/:deckId",
  validate(deckIdParamSchema, "params"),
  async (req, res) => {
    const deck = await getDeck(
      req.userId!,
      req.params.id as string,
      req.params.deckId as string,
    );
    res.json(deck);
  },
);
