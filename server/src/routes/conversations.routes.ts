import { Router } from "express";

import {
  createConversation,
  deleteConversation,
  listConversations,
  listMessages,
} from "../controllers/conversations.controllers";
import { validate } from "../middlewares/validate.middlewares";
import {
  createConversationSchema,
  listConversationsQuerySchema,
  listMessagesQuerySchema,
} from "../schemas/conversations.schemas";
import { idParamSchema } from "../schemas/params.schemas";

export const conversationsRouter = Router();
conversationsRouter.post(
  "/",
  validate(createConversationSchema),
  createConversation,
);
conversationsRouter.get(
  "/",
  validate(listConversationsQuerySchema, "query"),
  listConversations,
);
conversationsRouter.get(
  "/:id/messages",
  validate(idParamSchema, "params"),
  validate(listMessagesQuerySchema, "query"),
  listMessages,
);
conversationsRouter.delete(
  "/:id",
  validate(idParamSchema, "params"),
  deleteConversation,
);
