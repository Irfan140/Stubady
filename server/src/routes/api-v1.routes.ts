import { Router } from "express";

import { chatRouter } from "./chat.routes";
import { conversationsRouter } from "./conversations.routes";
import { flashcardsRouter } from "./flashcards.routes";
import { sourcesRouter } from "./sources.routes";
import { studySetsRouter } from "./study-sets.routes";
import { summariesRouter } from "./summaries.routes";

/**
 * Versioned API surface. All authenticated resources live under /api/v1 so
 * the contract can evolve independently of the shipped mobile clients.
 */
export const apiV1Router = Router();

apiV1Router.use("/sources", sourcesRouter);
apiV1Router.use("/study-sets", studySetsRouter);
apiV1Router.use("/study-sets", summariesRouter);
apiV1Router.use("/study-sets", flashcardsRouter);
apiV1Router.use("/conversations", conversationsRouter);
apiV1Router.use("/conversations", chatRouter);
