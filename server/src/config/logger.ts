import pino from "pino";

import { env } from "./env";

// The API and the ingestion worker share this module but run as separate
// OS processes — tag logs by entrypoint so they stay distinguishable.
const service = (process.argv[1] ?? "").includes("worker")
  ? "stubady-worker"
  : "stubady-api";

export const logger = pino({
  level: env.logLevel,
  base: { service },
});
