import { randomUUID } from "node:crypto";
import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";

import { logger } from "./config/logger";
import { requireAuth } from "./middlewares/auth.middlewares";
import { errorHandler } from "./middlewares/error.middlewares";
import { generalLimiter } from "./middlewares/rate-limits.middlewares";
import { apiV1Router } from "./routes/api-v1.routes";
import { healthRouter } from "./routes/health.routes";
import { webhooksRouter } from "./routes/webhooks.routes";

const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({ origin: true }));
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
app.use("/webhooks", webhooksRouter);

app.use(requireAuth);
app.use("/api/v1", apiV1Router);

app.use(errorHandler);

export { app };
