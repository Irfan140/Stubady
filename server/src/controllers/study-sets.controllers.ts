import type { Request, Response } from "express";

import {
  createStudySet as createStudySetService,
  deleteStudySet as deleteStudySetService,
  getStudySetOrThrow as getStudySetOrThrowService,
  listStudySets as listStudySetsService,
  updateStudySet as updateStudySetService,
} from "../services/study-sets.services";
import { parsePagination } from "../utils/pagination.utils";

export const createStudySet = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const studySet = await createStudySetService(req.userId!, req.body);
  res.status(201).json(studySet);
};

export const listStudySets = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await listStudySetsService(
    req.userId!,
    parsePagination(req.query as { limit?: string; cursor?: string }),
  );
  res.json(result);
};

export const getStudySet = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const studySet = await getStudySetOrThrowService(
    req.params.id as string,
    req.userId!,
  );
  res.json(studySet);
};

export const updateStudySet = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const studySet = await updateStudySetService(
    req.userId!,
    req.params.id as string,
    req.body,
  );
  res.json(studySet);
};

export const deleteStudySet = async (
  req: Request,
  res: Response,
): Promise<void> => {
  await deleteStudySetService(req.userId!, req.params.id as string);
  res.status(204).end();
};
