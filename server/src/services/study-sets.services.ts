import {
  createStudySet as persistStudySet,
  deleteStudySetForUser,
  findStudySetForUser,
  listStudySetsForUser,
  updateStudySetTitle,
  type StudySetListItem,
  type StudySetRecord,
} from "../repositories/study-sets.repositories";
import type {
  CreateStudySetInput,
  UpdateStudySetInput,
} from "../schemas/study-sets.schemas";
import { HttpError } from "../utils/http-error.utils";
import {
  paginate,
  type Paginated,
  type Pagination,
} from "../utils/pagination.utils";
import { deleteObjectsByPrefix } from "../lib/r2";
import { logger } from "../config/logger";

export const getStudySetOrThrow = async (
  studySetId: string,
  userId: string,
): Promise<StudySetRecord> => {
  const studySet = await findStudySetForUser(studySetId, userId);
  if (!studySet) throw new HttpError(404, "Study set not found");
  return studySet;
};

export const createStudySet = async (
  userId: string,
  input: CreateStudySetInput,
): Promise<StudySetListItem> => persistStudySet({ userId, title: input.title });

export const listStudySets = async (
  userId: string,
  pagination: Pagination,
): Promise<Paginated<StudySetListItem>> => {
  const rows = await listStudySetsForUser(userId, {
    limit: pagination.limit,
    offset: pagination.offset,
  });
  return paginate(rows, pagination.offset, pagination.limit);
};

export const updateStudySet = async (
  userId: string,
  studySetId: string,
  input: UpdateStudySetInput,
): Promise<StudySetRecord> => {
  const updated = await updateStudySetTitle(studySetId, userId, input.title);
  if (!updated) throw new HttpError(404, "Study set not found");
  return updated;
};

export const deleteStudySet = async (
  userId: string,
  studySetId: string,
): Promise<void> => {
  await getStudySetOrThrow(studySetId, userId);
  try {
    await deleteObjectsByPrefix(`users/${userId}/study-sets/${studySetId}/`);
  } catch (error) {
    // Storage cleanup must not prevent deletion of the user's database data.
    // The failed cleanup is logged so it can be retried operationally.
    logger.error(
      { error, userId, studySetId },
      "study set object cleanup failed",
    );
  }
  const deleted = await deleteStudySetForUser(studySetId, userId);
  if (!deleted) throw new HttpError(404, "Study set not found");
};
