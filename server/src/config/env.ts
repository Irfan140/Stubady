import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { z } from "zod";

/**
 * Loads a dotenv-style file into process.env using Node's built-in loader.
 * Variables already present in the environment always win over file values.
 * (When running through Bun, Bun also loads .env files automatically.)
 */
const loadEnvFileIfExists = (fileName: string): void => {
  const filePath = resolve(process.cwd(), fileName);
  if (existsSync(filePath)) {
    try {
      process.loadEnvFile(filePath);
    } catch {
      // ignore - validation below reports missing vars
    }
  }
};

loadEnvFileIfExists(".env");
if (process.env.NODE_ENV === "production") {
  loadEnvFileIfExists(".env.production");
} else {
  loadEnvFileIfExists(".env.development");
}

const envSchema = z
  .object({
    PORT: z.coerce.number().int().positive().default(3001),

    // PostgreSQL (docker compose / Neon / any Postgres connection string)
    DATABASE_URL: z.string().min(1),

    REDIS_URL: z.string().min(1).default("redis://localhost:6379"),

    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),

    CLERK_SECRET_KEY: z.string().min(1),
    CLERK_PUBLISHABLE_KEY: z.string().trim().default(""),
    CLERK_WEBHOOK_SECRET: z.string().trim().default(""),

    LANGSMITH_TRACING: z
      .preprocess(
        (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
        z.enum(["true", "false"]).default("false"),
      )
      .transform((v) => v === "true"),
    LANGSMITH_ENDPOINT: z.url().default("https://api.smith.langchain.com"),
    LANGSMITH_API_KEY: z.string().trim().default(""),
    LANGSMITH_PROJECT: z
      .string()
      .trim()
      .transform((v) => v.replace(/^["'](.*)["']$/, "$1"))
      .default("default"),

    OPENAI_API_KEY: z.string().min(1),
    OPENAI_CHAT_MODEL: z.string().min(1).default("gpt-4o-mini"),
    OPENAI_EMBEDDING_MODEL: z.string().min(1).default("text-embedding-3-small"),

    REVENUECAT_SECRET_API_KEY: z.string().trim().default(""),

    FIRECRAWL_API_KEY: z.string().min(1),

    R2_ACCOUNT_ID: z.string().trim().min(1),
    R2_ENDPOINT: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().trim().url().optional(),
    ),
    R2_ACCESS_KEY_ID: z.string().trim().min(1),
    R2_SECRET_ACCESS_KEY: z.string().trim().min(1),
    R2_BUCKET_NAME: z.string().trim().min(1),
  })
  .superRefine((data, ctx) => {
    if (data.LANGSMITH_TRACING && !data.LANGSMITH_API_KEY) {
      ctx.addIssue({
        code: "custom",
        path: ["LANGSMITH_API_KEY"],
        message: "LANGSMITH_API_KEY is required when LANGSMITH_TRACING=true",
      });
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid environment variables:\n${details}`);
}

export const env = {
  port: parsed.data.PORT,
  databaseUrl: parsed.data.DATABASE_URL,
  redisUrl: parsed.data.REDIS_URL,
  logLevel: parsed.data.LOG_LEVEL,
  clerkSecretKey: parsed.data.CLERK_SECRET_KEY,
  clerkPublishableKey: parsed.data.CLERK_PUBLISHABLE_KEY,
  clerkWebhookSecret: parsed.data.CLERK_WEBHOOK_SECRET,
  langsmithTracing: parsed.data.LANGSMITH_TRACING,
  langsmithEndpoint: parsed.data.LANGSMITH_ENDPOINT,
  langsmithApiKey: parsed.data.LANGSMITH_API_KEY,
  langsmithProject: parsed.data.LANGSMITH_PROJECT,
  openaiApiKey: parsed.data.OPENAI_API_KEY,
  chatModel: parsed.data.OPENAI_CHAT_MODEL,
  embeddingModel: parsed.data.OPENAI_EMBEDDING_MODEL,
  revenueCatSecretApiKey: parsed.data.REVENUECAT_SECRET_API_KEY,
  firecrawlApiKey: parsed.data.FIRECRAWL_API_KEY,
  r2AccountId: parsed.data.R2_ACCOUNT_ID,
  r2Endpoint:
    parsed.data.R2_ENDPOINT ??
    `https://${parsed.data.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  r2AccessKeyId: parsed.data.R2_ACCESS_KEY_ID,
  r2SecretAccessKey: parsed.data.R2_SECRET_ACCESS_KEY,
  r2BucketName: parsed.data.R2_BUCKET_NAME,
} as const;

export type Env = typeof env;
