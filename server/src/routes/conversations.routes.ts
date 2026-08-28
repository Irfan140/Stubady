import { Router } from "express";

import { validate } from "../middlewares/validate.middlewares";
import {
  createConversationSchema,
  listConversationsQuerySchema,
  listMessagesQuerySchema,
} from "../schemas/conversations.schemas";
import { idParamSchema } from "../schemas/params.schemas";
import {
  createConversation,
  deleteConversation,
  listConversations,
  listMessages,
} from "../services/conversations.services";
import { parsePagination } from "../utils/pagination.utils";

export const conversationsRouter = Router();
conversationsRouter.post(
  "/",
  validate(createConversationSchema),
  async (req, res) => {
    const conversation = await createConversation(req.userId!, req.body);
    res.status(201).json(conversation);
  },
);
conversationsRouter.get(
  "/",
  validate(listConversationsQuerySchema, "query"),
  async (req, res) => {
    const query = req.query as {
      studySetId: string;
      limit?: string;
      cursor?: string;
    };
    const result = await listConversations(req.userId!, {
      studySetId: query.studySetId,
      ...parsePagination(query),
    });
    res.json(result);
  },
);
conversationsRouter.get(
  "/:id/messages",
  validate(idParamSchema, "params"),
  validate(listMessagesQuerySchema, "query"),
  async (req, res) => {
    const query = req.query as {
      limit?: string;
      cursor?: string;
      order?: "asc" | "desc";
    };
    const result = await listMessages(req.userId!, req.params.id as string, {
      ...parsePagination(query),
      order: query.order ?? "asc",
    });
    res.json(result);
  },
);
conversationsRouter.delete(
  "/:id",
  validate(idParamSchema, "params"),
  async (req, res) => {
    await deleteConversation(req.userId!, req.params.id as string);
    res.status(204).end();
  },
);
