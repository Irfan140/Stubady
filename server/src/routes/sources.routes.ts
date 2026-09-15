import { Router } from "express";

import {
  completePdfUpload,
  createPdfUpload,
  createSource,
  deleteSource,
  getSource,
  listSources,
  retryProcessing,
} from "../controllers/sources.controllers";
import {
  aiLimiter,
  requireRedisForAi,
} from "../middlewares/rate-limits.middlewares";
import { validate } from "../middlewares/validate.middlewares";
import {
  createPdfUploadSchema,
  createSourceSchema,
  listSourcesQuerySchema,
} from "../schemas/sources.schemas";
import { idParamSchema } from "../schemas/params.schemas";

export const sourcesRouter = Router();
sourcesRouter.post("/", aiLimiter, validate(createSourceSchema), createSource);
sourcesRouter.post(
  "/pdf/upload-url",
  requireRedisForAi,
  aiLimiter,
  validate(createPdfUploadSchema),
  createPdfUpload,
);
sourcesRouter.get("/", validate(listSourcesQuerySchema, "query"), listSources);
sourcesRouter.get("/:id", validate(idParamSchema, "params"), getSource);
sourcesRouter.post(
  "/:id/process",
  requireRedisForAi,
  aiLimiter,
  validate(idParamSchema, "params"),
  retryProcessing,
);
sourcesRouter.post(
  "/:id/upload-complete",
  requireRedisForAi,
  aiLimiter,
  validate(idParamSchema, "params"),
  completePdfUpload,
);
sourcesRouter.delete("/:id", validate(idParamSchema, "params"), deleteSource);
