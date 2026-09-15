import { Router } from "express";

import {
  createSummary,
  deleteSummary,
  listSummaries,
} from "../controllers/summaries.controllers";
import { aiLimiter } from "../middlewares/rate-limits.middlewares";
import { validate } from "../middlewares/validate.middlewares";
import { idParamSchema, summaryIdParamSchema } from "../schemas/params.schemas";

export const summariesRouter = Router();
summariesRouter.post(
  "/:id/summary",
  aiLimiter,
  validate(idParamSchema, "params"),
  createSummary,
);
summariesRouter.get(
  "/:id/summaries",
  validate(idParamSchema, "params"),
  listSummaries,
);
summariesRouter.delete(
  "/:id/summaries/:summaryId",
  validate(summaryIdParamSchema, "params"),
  deleteSummary,
);
