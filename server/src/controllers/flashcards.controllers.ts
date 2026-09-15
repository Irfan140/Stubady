import type { Request, Response } from "express";

import {
  generateFlashcards as generateFlashcardsService,
  getDeck as getDeckService,
  listDecks as listDecksService,
} from "../services/flashcards.services";
import { parsePagination } from "../utils/pagination.utils";

export const generateFlashcards = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { deckId, cards } = await generateFlashcardsService(
    req.userId!,
    req.params.id as string,
    req.body,
  );
  res.status(201).json({ deckId, cards });
};

export const listDecks = async (req: Request, res: Response): Promise<void> => {
  const result = await listDecksService(
    req.userId!,
    req.params.id as string,
    parsePagination(req.query as { limit?: string; cursor?: string }),
  );
  res.json(result);
};

export const getDeck = async (req: Request, res: Response): Promise<void> => {
  const deck = await getDeckService(
    req.userId!,
    req.params.id as string,
    req.params.deckId as string,
  );
  res.json(deck);
};
