import { prisma } from "../lib/prisma";

export type StudySetRecord = {
  id: string;
  title: string;
};

export const findStudySetForUser = async (
  studySetId: string,
  userId: string,
): Promise<StudySetRecord | null> =>
  prisma.studySet.findFirst({
    where: { id: studySetId, userId },
    select: { id: true, title: true },
  });

export type StudySetListItem = StudySetRecord & { createdAt: Date };

export const createStudySet = async (input: {
  userId: string;
  title: string;
}): Promise<StudySetListItem> =>
  prisma.studySet.create({
    data: { userId: input.userId, title: input.title },
    select: { id: true, title: true, createdAt: true },
  });

export const listStudySetsForUser = async (
  userId: string,
  pagination: { limit: number; offset: number },
): Promise<StudySetListItem[]> =>
  prisma.studySet.findMany({
    where: { userId },
    select: { id: true, title: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: pagination.limit + 1,
    skip: pagination.offset,
  });

export const updateStudySetTitle = async (
  studySetId: string,
  userId: string,
  title: string,
): Promise<StudySetRecord | null> => {
  const res = await prisma.studySet.updateMany({
    where: { id: studySetId, userId },
    data: { title },
  });
  if (res.count === 0) return null;

  return prisma.studySet.findFirst({
    where: { id: studySetId, userId },
    select: { id: true, title: true },
  });
};

export const deleteStudySetForUser = async (
  studySetId: string,
  userId: string,
): Promise<boolean> => {
  const res = await prisma.studySet.deleteMany({
    where: { id: studySetId, userId },
  });
  return res.count > 0;
};
