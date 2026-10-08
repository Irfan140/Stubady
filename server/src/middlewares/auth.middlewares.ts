import type { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";

import { auth } from "../lib/auth";

const extractBearerToken = (
  header: string | string[] | undefined,
): string | null => {
  const value = Array.isArray(header) ? header[0] : header;
  if (!value) return null;
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
};

/**
 * Resolves the Better Auth session on every request and attaches the
 * authenticated user's id to `req.userId`. Accepts the session cookie and
 * `Authorization: Bearer <token>` (bearer plugin), plus the legacy
 * `x-access-token` fallback header.
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const fallback = req.headers["x-access-token"];
  const rawFallback = typeof fallback === "string" ? fallback.trim() : "";
  const token =
    extractBearerToken(req.headers.authorization) || rawFallback || null;

  if (!token) {
    res.status(401).json({ error: "Missing bearer token" });
    return;
  }

  try {
    const headers = fromNodeHeaders(req.headers);
    if (!headers.get("authorization") && rawFallback) {
      headers.set("authorization", `Bearer ${rawFallback}`);
    }
    const session = await auth.api.getSession({ headers });
    if (!session?.user) {
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }

    req.userId = session.user.id;
    req.accessToken = token;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};
