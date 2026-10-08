import { randomUUID } from "node:crypto";
import { toNodeHandler } from "better-auth/node";
import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";

import { env } from "./config/env";
import { logger } from "./config/logger";
import { auth } from "./lib/auth";
import { requireAuth } from "./middlewares/auth.middlewares";
import { errorHandler } from "./middlewares/error.middlewares";
import { generalLimiter } from "./middlewares/rate-limits.middlewares";
import { apiV1Router } from "./routes/api-v1.routes";
import { healthRouter } from "./routes/health.routes";

const app = express();

app.set("trust proxy", 1);
app.use(helmet());
// Outside production every origin is allowed so local web tooling and
// emulators work without config. In production only CORS_ORIGINS may call
// browser-side; native mobile callers are unaffected either way (no CORS).
// Mounted first so preflights never reach auth handlers.
if (env.isProduction && env.corsOrigins.length === 0) {
  logger.warn("CORS_ORIGINS is empty: browsers cannot call this API");
}
app.use(
  cors({
    origin: env.isProduction ? [...env.corsOrigins] : true,
    credentials: true,
  }),
);
app.use(
  pinoHttp({
    logger,
    genReqId: () => randomUUID(),
    redact: {
      paths: [
        "req.headers.authorization",
        "req.headers.cookie",
        "req.headers['x-access-token']",
      ],
      censor: "[REDACTED]",
    },
    autoLogging: {
      ignore: (req) => Boolean(req.url?.startsWith("/health")),
    },
  }),
);
// Better Auth must run before express.json(): body parsers consume the
// request stream that toNodeHandler needs. Public by design — sign-up,
// sign-in, and OTP endpoints live here. (Express 5 splat syntax.)
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(
  express.json({
    limit: "10mb",
    verify: (req, _res, buf) => {
      (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
    },
  }),
);
app.use(
  compression({
    filter: (req, res) =>
      !req.path.includes("/stream") && compression.filter(req, res),
  }),
);
app.use(generalLimiter);

app.use(healthRouter);

app.use(requireAuth);
app.use("/api/v1", apiV1Router);

app.use(errorHandler);

export { app };
