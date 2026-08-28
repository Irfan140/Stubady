import { env } from "@/config/env";
import { fetch as expoFetch } from "expo/fetch";
import { z } from "zod";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type GetToken = () => Promise<string | null>;
const REQUEST_TIMEOUT_MS = 20_000;
export const AI_REQUEST_TIMEOUT_MS = 90_000;

const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeoutMs: number = REQUEST_TIMEOUT_MS,
  fetcher: typeof fetch = fetch,
): Promise<Response> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const abortFromCaller = () => controller.abort();
  options.signal?.addEventListener("abort", abortFromCaller, { once: true });
  try {
    return await fetcher(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted && !options.signal?.aborted)
      throw new ApiError("Request timed out", 0);
    throw error;
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener("abort", abortFromCaller);
  }
};

const streamEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("token"), text: z.string() }),
  z.object({ type: z.literal("sources"), sources: z.array(z.unknown()) }),
  z.object({
    type: z.literal("done"),
    reply: z.string(),
    sources: z.array(z.unknown()),
  }),
  z.object({ type: z.literal("error"), error: z.string() }),
]);

export type StreamEvent = z.infer<typeof streamEventSchema>;

export async function apiRequest<T>(
  getToken: GetToken,
  path: string,
  options: RequestInit = {},
  timeoutMs: number = REQUEST_TIMEOUT_MS,
): Promise<T> {
  if (!env.apiUrl) throw new ApiError("Backend URL is not configured", 0);

  const token = await getToken();
  let response: Response;
  try {
    response = await fetchWithTimeout(
      `${env.apiUrl}/api/v1${path}`,
      {
        ...options,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options.headers,
        },
      },
      timeoutMs,
    );
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new ApiError(
      error instanceof Error ? error.message : "Network request failed",
      0,
    );
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new ApiError(
      body?.error ?? `Request failed (${response.status})`,
      response.status,
    );
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function apiStreamRequest(
  getToken: GetToken,
  path: string,
  body: unknown,
  onEvent: (event: StreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  if (!env.apiUrl) throw new ApiError("Backend URL is not configured", 0);
  const token = await getToken();
  let response: Response;
  try {
    response = await fetchWithTimeout(
      `${env.apiUrl}/api/v1${path}`,
      {
        method: "POST",
        headers: {
          Accept: "text/event-stream",
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
        signal,
      },
      REQUEST_TIMEOUT_MS,
      expoFetch,
    );
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ApiError(
      error instanceof Error ? error.message : "Network request failed",
      0,
    );
  }
  if (!response.ok) {
    const result = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new ApiError(
      result?.error ?? `Request failed (${response.status})`,
      response.status,
    );
  }
  if (!response.body)
    throw new ApiError("Streaming is not supported by this device", 0);
  const reader = response.body.getReader();
  const abortReader = () => {
    void reader.cancel();
  };
  signal?.addEventListener("abort", abortReader, { once: true });
  try {
    const decoder = new TextDecoder();
    let buffer = "";
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      buffer += decoder.decode(chunk.value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";
      for (const raw of events) {
        const line = raw
          .split("\n")
          .find((value) => value.startsWith("data: "));
        if (!line) continue;
        onEvent(streamEventSchema.parse(JSON.parse(line.slice(6))));
      }
    }
    if (buffer.trim()) {
      const line = buffer
        .split("\n")
        .find((value) => value.startsWith("data: "));
      if (line) onEvent(streamEventSchema.parse(JSON.parse(line.slice(6))));
    }
  } finally {
    signal?.removeEventListener("abort", abortReader);
    reader.releaseLock();
  }
}
