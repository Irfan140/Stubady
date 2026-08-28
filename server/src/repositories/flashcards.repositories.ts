import { prisma } from "../lib/prisma";

export const insertDeck = async (input: {
  userId: string;
  studySetId: string;
  title: string;
  promptVersion?: string;
}): Promise<{ id: string }> => {
  const deck = await prisma.flashcardDeck.create({
    data: {
      userId: input.userId,
      studySetId: input.studySetId,
      title: input.title,
      promptVersion: input.promptVersion,
    },
    select: { id: true },
  });

  return { id: deck.id };
};

export const insertCards = async (
  rows: Array<{
    deckId: string;
    front: string;
    back: string;
    sortOrder: number;
  }>,
): Promise<void> => {
  await prisma.flashcard.createMany({
    data: rows.map((row) => ({
      deckId: row.deckId,
      front: row.front,
      back: row.back,
      sortOrder: row.sortOrder,
    })),
  });
};

export type DeckListItem = {
  id: string;
  title: string;
  cardCount: number;
  createdAt: Date;
};

export const listDecksForUser = async (
  studySetId: string,
  userId: string,
  pagination: { limit: number; offset: number },
): Promise<DeckListItem[]> => {
  const rows = await prisma.flashcardDeck.findMany({
    where: { studySetId, userId },
    select: {
      id: true,
      title: true,
      createdAt: true,
      _count: { select: { cards: true } },
    },
    orderBy: { createdAt: "desc" },
    take: pagination.limit + 1,
    skip: pagination.offset,
  });
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    createdAt: row.createdAt,
    cardCount: row._count.cards,
  }));
};

export type DeckWithCards = {
  id: string;
  title: string;
  cards: Array<{
    id: string;
    front: string;
    back: string;
    sortOrder: number;
  }>;
};

export const findDeckWithCardsForUser = async (
  deckId: string,
  userId: string,
  studySetId: string,
): Promise<DeckWithCards | null> =>
  prisma.flashcardDeck.findFirst({
    where: { id: deckId, userId, studySetId },
    select: {
      id: true,
      title: true,
      cards: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, front: true, back: true, sortOrder: true },
      },
    },
  });
