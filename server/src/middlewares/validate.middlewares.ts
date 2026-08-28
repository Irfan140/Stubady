import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

import { HttpError } from "../utils/http-error.utils";

type ValidatedPart = "body" | "params" | "query";

/**
 * Creates middleware that validates a request part against a zod schema.
 * On success the parsed (and transformed) data replaces the raw value so
 * downstream handlers only ever see trusted data; on failure it forwards
 * a 400 error to the central error handler.
 */
export const validate = <T>(
  schema: ZodType<T>,
  part: ValidatedPart = "body",
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);

    if (!result.success) {
      const firstIssue = result.error.issues[0];
      next(new HttpError(400, firstIssue?.message ?? "Invalid request"));
      return;
    }

    if (part === "body") {
      req.body = result.data;
    } else {
      Object.assign(req[part] as Record<string, unknown>, result.data);
    }

    next();
  };
};
