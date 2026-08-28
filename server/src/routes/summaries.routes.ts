import { Router } from "express";

import { aiLimiter } from "../middlewares/rate-limits.middlewares";
import { validate } from "../middlewares/validate.middlewares";
import { idParamSchema } from "../schemas/params.schemas";
import { createSummary, listSummaries } from "../services/summaries.services";
import { parsePagination } from "../utils/pagination.utils";

export const summariesRouter = Router();
summariesRouter.post(
  "/:id/summary",
  aiLimiter,
  validate(idParamSchema, "params"),
  async (req, res) => {
    const summary = await createSummary(req.userId!, req.params.id as string);
    res.status(201).json({ id: summary.id, content: summary.content });
  },
);
summariesRouter.get(
  "/:id/summaries",
  validate(idParamSchema, "params"),
  async (req, res) => {
    const result = await listSummaries(
      req.userId!,
      req.params.id as string,
      parsePagination(req.query as { limit?: string; cursor?: string }),
    );
    res.json(result);
  },
);
