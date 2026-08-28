import { prisma } from "../lib/prisma";

export const deleteAllUserData = async (userId: string): Promise<number> => {
  // study_sets cascade → sources → chunks, conversations → messages,
  // summaries, and flashcard_decks → flashcards. Everything else hangs off a
  // study set, so a single deleteMany removes the whole tree.
  const res = await prisma.studySet.deleteMany({ where: { userId } });
  return res.count;
};
