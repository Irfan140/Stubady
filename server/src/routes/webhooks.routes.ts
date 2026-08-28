import { Router } from "express";
import type { Request } from "express";
import { Webhook } from "svix";

import { env } from "../config/env";
import { logger } from "../config/logger";
import { deleteAllUserData } from "../repositories/users.repositories";
import { deleteObjectsByPrefix, userStoragePrefix } from "../lib/r2";

export const webhooksRouter = Router();

type RawBodyRequest = Request & { rawBody?: Buffer };

type ClerkEvent = {
  type: string;
  data?: { id?: string };
};

/**
 * Public Clerk webhook endpoint. Verifies the Svix signature against the raw
 * body, then reacts to supported events (currently `user.deleted` → purge
 * the user's data so no orphaned rows remain).
 */
webhooksRouter.post("/clerk", async (req: Request, res) => {
  if (!env.clerkWebhookSecret) {
    res.status(503).json({ error: "Webhook not configured" });
    return;
  }

  const rawBody =
    (req as RawBodyRequest).rawBody?.toString() ?? JSON.stringify(req.body);

  const headers = {
    "svix-id": req.headers["svix-id"] as string,
    "svix-timestamp": req.headers["svix-timestamp"] as string,
    "svix-signature": req.headers["svix-signature"] as string,
  };

  let event: ClerkEvent;
  try {
    event = new Webhook(env.clerkWebhookSecret).verify(
      rawBody,
      headers,
    ) as ClerkEvent;
  } catch (err) {
    logger.warn({ err }, "rejected invalid webhook signature");
    res.status(400).json({ error: "Invalid signature" });
    return;
  }

  if (event.type === "user.deleted" && event.data?.id) {
    await deleteObjectsByPrefix(userStoragePrefix(event.data.id));
    const deleted = await deleteAllUserData(event.data.id);
    logger.info(
      { userId: event.data.id, studySetsDeleted: deleted },
      "purged data for deleted Clerk user",
    );
  }

  res.status(204).end();
});
