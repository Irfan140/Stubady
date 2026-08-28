import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "@clerk/express";

import { env } from "../config/env";

const extractBearerToken = (
  header: string | string[] | undefined,
): string | null => {
  const value = Array.isArray(header) ? header[0] : header;
  if (!value) return null;
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
};

/**
 * Verifies the Clerk session/JWT token on every request and attaches the
 * authenticated user's id to `req.userId`.
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const fallback = req.headers["x-access-token"];
  const token =
    extractBearerToken(req.headers.authorization) ??
    (typeof fallback === "string" ? fallback.trim() : null);

  if (!token) {
    res.status(401).json({ error: "Missing bearer token" });
    return;
  }

  try {
    const claims = await verifyToken(token, { secretKey: env.clerkSecretKey });
    const userId = claims?.sub;
    if (!userId) throw new Error("Token has no subject claim");

    req.userId = userId;
    req.accessToken = token;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};
