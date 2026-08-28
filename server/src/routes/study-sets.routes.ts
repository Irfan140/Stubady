import { Router } from "express";

import { validate } from "../middlewares/validate.middlewares";
import {
  createStudySetSchema,
  updateStudySetSchema,
} from "../schemas/study-sets.schemas";
import { idParamSchema } from "../schemas/params.schemas";
import {
  createStudySet,
  deleteStudySet,
  getStudySetOrThrow,
  listStudySets,
  updateStudySet,
} from "../services/study-sets.services";
import { parsePagination } from "../utils/pagination.utils";

export const studySetsRouter = Router();
studySetsRouter.post("/", validate(createStudySetSchema), async (req, res) => {
  const studySet = await createStudySet(req.userId!, req.body);
  res.status(201).json(studySet);
});
studySetsRouter.get("/", async (req, res) => {
  const result = await listStudySets(
    req.userId!,
    parsePagination(req.query as { limit?: string; cursor?: string }),
  );
  res.json(result);
});
studySetsRouter.get(
  "/:id",
  validate(idParamSchema, "params"),
  async (req, res) => {
    const studySet = await getStudySetOrThrow(
      req.params.id as string,
      req.userId!,
    );
    res.json(studySet);
  },
);
studySetsRouter.patch(
  "/:id",
  validate(idParamSchema, "params"),
  validate(updateStudySetSchema),
  async (req, res) => {
    const studySet = await updateStudySet(
      req.userId!,
      req.params.id as string,
      req.body,
    );
    res.json(studySet);
  },
);
studySetsRouter.delete(
  "/:id",
  validate(idParamSchema, "params"),
  async (req, res) => {
    await deleteStudySet(req.userId!, req.params.id as string);
    res.status(204).end();
  },
);
