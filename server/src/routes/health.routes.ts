import { Router } from "express";

import {
  checkLiveness,
  checkReadiness,
} from "../controllers/health.controllers";

export const healthRouter = Router();

/** Liveness: process is up. Unauthenticated by design. */
healthRouter.get("/health", checkLiveness);

/** Readiness: database and Redis are both reachable. */
healthRouter.get("/health/ready", checkReadiness);
