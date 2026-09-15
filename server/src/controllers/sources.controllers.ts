import type { Request, Response } from "express";

import {
  completePdfUpload as completePdfUploadService,
  createPdfUpload as createPdfUploadService,
  createSource as createSourceService,
  deleteSource as deleteSourceService,
  getSource as getSourceService,
  listSources as listSourcesService,
  retryProcessing as retryProcessingService,
} from "../services/sources.services";
import { parsePagination } from "../utils/pagination.utils";

export const createSource = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const source = await createSourceService(req.userId!, req.body);
  res.status(201).json(source);
};

export const createPdfUpload = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await createPdfUploadService(req.userId!, req.body);
  res.status(201).json(result);
};

export const listSources = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const query = req.query as {
    studySetId: string;
    limit?: string;
    cursor?: string;
  };
  const result = await listSourcesService(req.userId!, {
    studySetId: query.studySetId,
    ...parsePagination(query),
  });
  res.json(result);
};

export const getSource = async (req: Request, res: Response): Promise<void> => {
  const source = await getSourceService(req.userId!, req.params.id as string);
  res.json(source);
};

export const retryProcessing = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { jobId } = await retryProcessingService(
    req.userId!,
    req.params.id as string,
  );
  res.status(202).json({ jobId, status: "queued" });
};

export const completePdfUpload = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await completePdfUploadService(
    req.userId!,
    req.params.id as string,
  );
  res.status(202).json({ ...result, status: "queued" });
};

export const deleteSource = async (
  req: Request,
  res: Response,
): Promise<void> => {
  await deleteSourceService(req.userId!, req.params.id as string);
  res.status(204).end();
};
