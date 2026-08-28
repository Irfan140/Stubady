import type { NextFunction, Request, Response } from "express";

import { logger } from "../config/logger";
import { HttpError } from "../utils/http-error.utils";

const PRISMA_RECORD_NOT_FOUND = "P2025";

const resolveStatus = (err: unknown): number => {
  if (err instanceof HttpError) return err.status;
  if ((err as { code?: string } | null)?.code === PRISMA_RECORD_NOT_FOUND)
    return 404;
  if ((err as { name?: string } | null)?.name === "ZodError") return 400;
  return 500;
};

/**
 * Central error handler. Maps HttpError / Prisma / Zod errors to proper
 * status codes and NEVER leaks internal messages for unexpected 500s —
 * those are logged with request id instead (correlates with pino-http).
 */
export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const status = resolveStatus(err);

  const message =
    err instanceof HttpError
      ? err.message
      : status === 404
        ? "Requested record not found"
        : status === 400
          ? "Invalid request payload"
          : "Internal server error";

  if (status >= 500) {
    const requestId = (req as Request & { id?: string }).id;
    logger.error({ err, requestId }, "request failed");
  }

  if (!res.headersSent) {
    res.status(status).json({ error: message });
  }
};
