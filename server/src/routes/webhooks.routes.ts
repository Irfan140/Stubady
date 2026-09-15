import { Router } from "express";

import { handleClerkWebhook } from "../controllers/webhooks.controllers";

export const webhooksRouter = Router();

/**
 * Public Clerk webhook endpoint. Verifies the Svix signature against the raw
 * body, then reacts to supported events (currently `user.deleted` → purge
 * the user's data so no orphaned rows remain).
 */
webhooksRouter.post("/clerk", handleClerkWebhook);
