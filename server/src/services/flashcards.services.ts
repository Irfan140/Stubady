import { HumanMessage, SystemMessage } from "@langchain/core/messages";

import { PROMPT_VERSIONS } from "../config/constants";
import { logger } from "../config/logger";
import { flashcardModel } from "../lib/ai";
import {
  findDeckWithCardsForUser,
  insertCards,
  insertDeck,
  listDecksForUser,
  type DeckListItem,
  type DeckWithCards,
} from "../repositories/flashcards.repositories";
import { findStudySetForUser } from "../repositories/study-sets.repositories";
import {
  buildFlashcardsOutputSchema,
  FLASHCARD_COUNT_DEFAULT,
  type Flashcard,
  type GenerateFlashcardsInput,
} from "../schemas/flashcards.schemas";
import { HttpError } from "../utils/http-error.utils";
import {
  paginate,
  type Paginated,
  type Pagination,
} from "../utils/pagination.utils";
import { getStudySetText } from "./rag.services";

const systemPrompt = (count: number): string =>
  `You are a careful study-material flashcard writer. Generate exactly ${count} concise, high-quality flashcards from ONLY the provided material.
Each card has a "front" (question or term) and a "back" (answer or definition).
Do not add facts or answers from outside knowledge. Every answer must be directly supported by the material.
If a concept is unclear or unsupported, do not create a card for it. Focus on concepts a student needs to understand and remember.`;

export const generateFlashcards = async (
  userId: string,
  studySetId: string,
  input: GenerateFlashcardsInput,
): Promise<{ deckId: string; cards: Flashcard[] }> => {
  const studySet = await findStudySetForUser(studySetId, userId);
  if (!studySet) {
    throw new HttpError(404, "Study set not found");
  }

  const material = await getStudySetText(studySetId);
  if (!material) {
    throw new HttpError(
      422,
      "No processed sources to generate flashcards from yet",
    );
  }

  const count = input.count ?? FLASHCARD_COUNT_DEFAULT;

  const structuredFlashcardModel = flashcardModel.withStructuredOutput(
    buildFlashcardsOutputSchema(count),
  );

  let cards: Flashcard[];
  try {
    ({ cards } = await structuredFlashcardModel.invoke([
      new SystemMessage(systemPrompt(count)),
      new HumanMessage(material),
    ]));
  } catch (err) {
    // Malformed model output or provider failure — not a server bug.
    logger.warn({ err }, "structured flashcard generation failed");
    throw new HttpError(
      502,
      "The model returned an invalid response. Please try again.",
    );
  }

  const deck = await insertDeck({
    userId,
    studySetId,
    title: `${studySet.title} Flashcards`,
    promptVersion: PROMPT_VERSIONS.flashcards,
  });

  await insertCards(
    cards.map((card, index) => ({
      deckId: deck.id,
      front: card.front,
      back: card.back,
      sortOrder: index,
    })),
  );

  return { deckId: deck.id, cards };
};

export const listDecks = async (
  userId: string,
  studySetId: string,
  pagination: Pagination,
): Promise<Paginated<DeckListItem>> => {
  const studySet = await findStudySetForUser(studySetId, userId);
  if (!studySet) throw new HttpError(404, "Study set not found");
  const rows = await listDecksForUser(studySetId, userId, {
    limit: pagination.limit,
    offset: pagination.offset,
  });
  return paginate(rows, pagination.offset, pagination.limit);
};

export const getDeck = async (
  userId: string,
  studySetId: string,
  deckId: string,
): Promise<DeckWithCards> => {
  const studySet = await findStudySetForUser(studySetId, userId);
  if (!studySet) throw new HttpError(404, "Study set not found");

  const deck = await findDeckWithCardsForUser(deckId, userId, studySetId);
  if (!deck || deck.id !== deckId) throw new HttpError(404, "Deck not found");
  return deck;
};
