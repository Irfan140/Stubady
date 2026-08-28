export const PAGINATION_DEFAULTS = {
  limit: 20,
  maxLimit: 100,
} as const;

export type Pagination = { limit: number; offset: number };

const encodeCursor = (offset: number): string =>
  Buffer.from(`o:${offset}`).toString("base64url");

const decodeCursor = (cursor: string | undefined): number => {
  if (!cursor) return 0;
  try {
    const decoded = Buffer.from(cursor, "base64url").toString();
    if (!decoded.startsWith("o:")) return 0;
    const n = Number.parseInt(decoded.slice(2), 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
};

export const parsePagination = (query: {
  limit?: string;
  cursor?: string;
}): Pagination => {
  const rawLimit = Number.parseInt(query.limit ?? "", 10);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(PAGINATION_DEFAULTS.maxLimit, Math.max(1, rawLimit))
    : PAGINATION_DEFAULTS.limit;

  return { limit, offset: decodeCursor(query.cursor) };
};

export type Paginated<T> = { data: T[]; nextCursor: string | null };

/**
 * Builds a paginated response from rows fetched with `limit + 1` items.
 * Returns at most `limit` items plus the cursor for the next page.
 */
export const paginate = <T>(
  rows: T[],
  offset: number,
  limit: number,
): Paginated<T> => {
  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? encodeCursor(offset + limit) : null;
  return { data, nextCursor };
};
