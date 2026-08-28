import { prisma } from "../lib/prisma";

export const insertSummary = async (input: {
  userId: string;
  studySetId: string;
  content: string;
  model: string;
  promptVersion: string;
}): Promise<{ id: string }> => {
  const row = await prisma.summary.create({
    data: {
      userId: input.userId,
      studySetId: input.studySetId,
      content: input.content,
      model: input.model,
      promptVersion: input.promptVersion,
    },
    select: { id: true },
  });

  return { id: row.id };
};

export type SummaryListItem = {
  id: string;
  content: string;
  model: string;
  promptVersion: string;
  createdAt: Date;
};

export const listSummariesForUser = async (
  studySetId: string,
  userId: string,
  pagination: { limit: number; offset: number },
): Promise<SummaryListItem[]> =>
  prisma.summary.findMany({
    where: { studySetId, userId },
    select: {
      id: true,
      content: true,
      model: true,
      promptVersion: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: pagination.limit + 1,
    skip: pagination.offset,
  });
