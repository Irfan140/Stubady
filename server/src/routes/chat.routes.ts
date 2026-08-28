import { Router } from "express";
import type { ChatStreamEvent } from "../services/chat.services";

import { logger } from "../config/logger";
import { aiLimiter } from "../middlewares/rate-limits.middlewares";
import { validate } from "../middlewares/validate.middlewares";
import { chatMessageSchema } from "../schemas/chat.schemas";
import { idParamSchema } from "../schemas/params.schemas";
import { registerStream } from "../lib/stream-registry";
import { generateReply, streamReply } from "../services/chat.services";

export const chatRouter = Router();
chatRouter.post(
  "/:id/chat",
  aiLimiter,
  validate(idParamSchema, "params"),
  validate(chatMessageSchema),
  async (req, res) => {
    const { reply, sources } = await generateReply(
      req.userId!,
      req.params.id as string,
      req.body.message,
    );
    res.json({ reply, sources });
  },
);
// Event payloads match ChatStreamEvent: token | sources | done.
chatRouter.post(
  "/:id/chat/stream",
  aiLimiter,
  validate(idParamSchema, "params"),
  validate(chatMessageSchema),
  async (req, res, next) => {
    const controller = new AbortController();
    res.on("close", () => controller.abort());

    const iterator: AsyncIterator<ChatStreamEvent> = streamReply(
      req.userId!,
      req.params.id as string,
      req.body.message,
      controller.signal,
    )[Symbol.asyncIterator]();

    // Pull the first event before committing to SSE so pre-stream failures
    // (404s etc.) still reach the central error handler as JSON.
    let first: IteratorResult<ChatStreamEvent>;
    try {
      first = await iterator.next();
    } catch (err) {
      next(err);
      return;
    }

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });

    // Track the stream so graceful shutdown can end it (see stream-registry).
    registerStream(res);

    const push = (event: unknown): void => {
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }
    };

    if (!first.done) push(first.value);

    try {
      for (;;) {
        const { value, done } = await iterator.next();
        if (done) break;
        push(value);
      }
    } catch (err) {
      // A client disconnect aborts the signal and surfaces here — not an error.
      if (!controller.signal.aborted) {
        logger.error({ err }, "chat stream failed mid-flight");
        push({ type: "error", error: "Stream interrupted" });
      }
    } finally {
      if (!res.writableEnded) res.end();
    }
  },
);
