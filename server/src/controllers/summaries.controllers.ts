import type { Request, Response } from "express";

import {
  createSummary as createSummaryService,
  deleteSummary as deleteSummaryService,
  listSummaries as listSummariesService,
} from "../services/summaries.services";
import { parsePagination } from "../utils/pagination.utils";

export const createSummary = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const summary = await createSummaryService(
    req.userId!,
    req.params.id as string,
  );
  res.status(201).json({ id: summary.id, content: summary.content });
};

export const listSummaries = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await listSummariesService(
    req.userId!,
    req.params.id as string,
    parsePagination(req.query as { limit?: string; cursor?: string }),
  );
  res.json(result);
};

export const deleteSummary = async (
  req: Request,
  res: Response,
): Promise<void> => {
  await deleteSummaryService(
    req.userId!,
    req.params.id as string,
    req.params.summaryId as string,
  );
  res.status(204).end();
};
