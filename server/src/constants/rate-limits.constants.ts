/** Express rate-limit buckets. */

export const RATE_LIMITS = {
  windowMs: 60_000,
  generalMax: 120,
  aiMax: 10,
} as const;
