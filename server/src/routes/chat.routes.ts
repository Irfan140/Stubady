import { Router } from "express";

import {
  sendChatMessage,
  streamChatMessage,
} from "../controllers/chat.controllers";
import {
  aiLimiter,
  requireRedisForAi,
} from "../middlewares/rate-limits.middlewares";
import { validate } from "../middlewares/validate.middlewares";
import { chatMessageSchema } from "../schemas/chat.schemas";
import { idParamSchema } from "../schemas/params.schemas";

export const chatRouter = Router();
chatRouter.post(
  "/:id/chat",
  requireRedisForAi,
  aiLimiter,
  validate(idParamSchema, "params"),
  validate(chatMessageSchema),
  sendChatMessage,
);
// Event payloads match ChatStreamEvent: token | sources | done.
chatRouter.post(
  "/:id/chat/stream",
  requireRedisForAi,
  aiLimiter,
  validate(idParamSchema, "params"),
  validate(chatMessageSchema),
  streamChatMessage,
);
