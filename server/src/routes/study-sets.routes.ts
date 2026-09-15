import { Router } from "express";

import {
  createStudySet,
  deleteStudySet,
  getStudySet,
  listStudySets,
  updateStudySet,
} from "../controllers/study-sets.controllers";
import { validate } from "../middlewares/validate.middlewares";
import {
  createStudySetSchema,
  updateStudySetSchema,
} from "../schemas/study-sets.schemas";
import { idParamSchema } from "../schemas/params.schemas";

export const studySetsRouter = Router();
studySetsRouter.post("/", validate(createStudySetSchema), createStudySet);
studySetsRouter.get("/", listStudySets);
studySetsRouter.get("/:id", validate(idParamSchema, "params"), getStudySet);
studySetsRouter.patch(
  "/:id",
  validate(idParamSchema, "params"),
  validate(updateStudySetSchema),
  updateStudySet,
);
studySetsRouter.delete(
  "/:id",
  validate(idParamSchema, "params"),
  deleteStudySet,
);
