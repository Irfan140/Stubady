import { Router } from "express";

import { aiLimiter } from "../middlewares/rate-limits.middlewares";
import { validate } from "../middlewares/validate.middlewares";
import {
  createPdfUploadSchema,
  createSourceSchema,
  listSourcesQuerySchema,
} from "../schemas/sources.schemas";
import { idParamSchema } from "../schemas/params.schemas";
import {
  createSource,
  createPdfUpload,
  completePdfUpload,
  deleteSource,
  getSource,
  listSources,
  retryProcessing,
} from "../services/sources.services";
import { parsePagination } from "../utils/pagination.utils";

export const sourcesRouter = Router();
sourcesRouter.post(
  "/",
  aiLimiter,
  validate(createSourceSchema),
  async (req, res) => {
    const source = await createSource(req.userId!, req.body);
    res.status(201).json(source);
  },
);
sourcesRouter.post(
  "/pdf/upload-url",
  aiLimiter,
  validate(createPdfUploadSchema),
  async (req, res) => {
    const result = await createPdfUpload(req.userId!, req.body);
    res.status(201).json(result);
  },
);
sourcesRouter.get(
  "/",
  validate(listSourcesQuerySchema, "query"),
  async (req, res) => {
    const query = req.query as {
      studySetId: string;
      limit?: string;
      cursor?: string;
    };
    const result = await listSources(req.userId!, {
      studySetId: query.studySetId,
      ...parsePagination(query),
    });
    res.json(result);
  },
);
sourcesRouter.get(
  "/:id",
  validate(idParamSchema, "params"),
  async (req, res) => {
    const source = await getSource(req.userId!, req.params.id as string);
    res.json(source);
  },
);
sourcesRouter.post(
  "/:id/process",
  aiLimiter,
  validate(idParamSchema, "params"),
  async (req, res) => {
    const { jobId } = await retryProcessing(
      req.userId!,
      req.params.id as string,
    );
    res.status(202).json({ jobId, status: "queued" });
  },
);
sourcesRouter.post(
  "/:id/upload-complete",
  aiLimiter,
  validate(idParamSchema, "params"),
  async (req, res) => {
    const result = await completePdfUpload(
      req.userId!,
      req.params.id as string,
    );
    res.status(202).json({ ...result, status: "queued" });
  },
);
sourcesRouter.delete(
  "/:id",
  validate(idParamSchema, "params"),
  async (req, res) => {
    await deleteSource(req.userId!, req.params.id as string);
    res.status(204).end();
  },
);
