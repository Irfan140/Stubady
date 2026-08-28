import { useAuth } from "@clerk/expo";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";

import {
  AI_REQUEST_TIMEOUT_MS,
  apiRequest,
  apiStreamRequest,
} from "@/lib/api/client";
import {
  chatResultSchema,
  conversationSchema,
  deckSchema,
  deckWithCardsSchema,
  flashcardResultSchema,
  messageSchema,
  pdfUploadCompleteSchema,
  pdfUploadSessionSchema,
  type DeckWithCards,
  type Page,
  type Source,
  sourceSchema,
  studySetSchema,
  summaryResultSchema,
  summarySchema,
} from "./types";

const page = <T extends z.ZodType>(schema: T) =>
  z.object({ data: z.array(schema), nextCursor: z.string().nullable() });
const cursorPath = (path: string, cursor: string | null) =>
  cursor
    ? `${path}${path.includes("?") ? "&" : "?"}cursor=${encodeURIComponent(cursor)}`
    : path;
const keys = {
  sets: ["study-sets"] as const,
  set: (id: string) => ["study-set", id] as const,
  sources: (id: string) => ["sources", id] as const,
  summaries: (id: string) => ["summaries", id] as const,
  decks: (id: string) => ["decks", id] as const,
  deck: (setId: string, deckId: string) => ["deck", setId, deckId] as const,
  conversations: (id: string) => ["conversations", id] as const,
  messages: (id: string) => ["messages", id] as const,
};
const withSourceAtFront = (
  current: InfiniteData<Page<Source>> | undefined,
  source: Source,
): InfiniteData<Page<Source>> | undefined =>
  current
    ? {
        ...current,
        pages: current.pages.map((page, index) =>
          index === 0
            ? {
                ...page,
                data: [
                  source,
                  ...page.data.filter((item) => item.id !== source.id),
                ],
              }
            : page,
        ),
      }
    : current;

export function useStudySets() {
  const { getToken } = useAuth();
  const query = useInfiniteQuery({
    queryKey: keys.sets,
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam, signal }) =>
      page(studySetSchema).parse(
        await apiRequest<Page<unknown>>(
          getToken,
          cursorPath("/study-sets", pageParam),
          { signal },
        ),
      ),
    getNextPageParam: (last) => last.nextCursor,
  });
  return {
    ...query,
    items: query.data?.pages.flatMap((item) => item.data) ?? [],
  };
}

export function useStudySet(id: string) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: keys.set(id),
    queryFn: async ({ signal }) =>
      studySetSchema.parse(
        await apiRequest(getToken, `/study-sets/${id}`, { signal }),
      ),
    enabled: Boolean(id),
  });
}
export function useCreateStudySet() {
  const { getToken } = useAuth();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (title: string) =>
      studySetSchema.parse(
        await apiRequest(getToken, "/study-sets", {
          method: "POST",
          body: JSON.stringify({ title }),
        }),
      ),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.sets }),
  });
}
export function useUpdateStudySet(id: string) {
  const { getToken } = useAuth();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (title: string) =>
      studySetSchema.parse(
        await apiRequest(getToken, `/study-sets/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ title }),
        }),
      ),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: keys.set(id) });
      void client.invalidateQueries({ queryKey: keys.sets });
    },
  });
}
export function useDeleteStudySet() {
  const { getToken } = useAuth();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest<void>(getToken, `/study-sets/${id}`, { method: "DELETE" }),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.sets }),
  });
}

export function useSources(studySetId: string) {
  const { getToken } = useAuth();
  const query = useInfiniteQuery({
    queryKey: keys.sources(studySetId),
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam, signal }) =>
      page(sourceSchema).parse(
        await apiRequest<Page<unknown>>(
          getToken,
          cursorPath(
            `/sources?studySetId=${encodeURIComponent(studySetId)}`,
            pageParam,
          ),
          { signal },
        ),
      ),
    getNextPageParam: (last) => last.nextCursor,
    enabled: Boolean(studySetId),
    refetchInterval: (current) =>
      current.state.data?.pages.some((item) =>
        item.data.some(
          (source) =>
            source.status === "pending" || source.status === "processing",
        ),
      )
        ? 3000
        : false,
  });
  return {
    ...query,
    items: query.data?.pages.flatMap((item) => item.data) ?? [],
  };
}
export function useCreateSource(studySetId: string) {
  const { getToken } = useAuth();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (
      input:
        | { type: "note"; studySetId: string; content: string }
        | { type: "web"; studySetId: string; url: string },
    ) =>
      sourceSchema.parse(
        await apiRequest(getToken, "/sources", {
          method: "POST",
          body: JSON.stringify(input),
        }),
      ),
    onSuccess: (source) => {
      client.setQueryData<InfiniteData<Page<Source>>>(
        keys.sources(studySetId),
        (current) => withSourceAtFront(current, source),
      );
      return client.invalidateQueries({ queryKey: keys.sources(studySetId) });
    },
  });
}
export function useCreatePdfUpload() {
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      studySetId: string;
      fileName: string;
      contentType: "application/pdf";
      size: number;
    }) =>
      pdfUploadSessionSchema.parse(
        await apiRequest(getToken, "/sources/pdf/upload-url", {
          method: "POST",
          body: JSON.stringify(input),
        }),
      ),
  });
}
export function useCompletePdfUpload(studySetId: string) {
  const { getToken } = useAuth();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (sourceId: string) =>
      pdfUploadCompleteSchema.parse(
        await apiRequest(getToken, `/sources/${sourceId}/upload-complete`, {
          method: "POST",
        }),
      ),
    onSuccess: (result) => {
      client.setQueryData<InfiniteData<Page<Source>>>(
        keys.sources(studySetId),
        (current) => withSourceAtFront(current, result.source),
      );
      return client.invalidateQueries({ queryKey: keys.sources(studySetId) });
    },
  });
}
export function useDeleteSource(studySetId: string) {
  const { getToken } = useAuth();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (sourceId: string) =>
      apiRequest<void>(getToken, `/sources/${sourceId}`, { method: "DELETE" }),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: keys.sources(studySetId) }),
  });
}
export function useRetrySource(studySetId: string) {
  const { getToken } = useAuth();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (sourceId: string) =>
      z
        .object({ jobId: z.string().optional(), status: z.literal("queued") })
        .parse(
          await apiRequest(getToken, `/sources/${sourceId}/process`, {
            method: "POST",
          }),
        ),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: keys.sources(studySetId) }),
  });
}

export function useSummaries(studySetId: string) {
  const { getToken } = useAuth();
  const query = useInfiniteQuery({
    queryKey: keys.summaries(studySetId),
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam, signal }) =>
      page(summarySchema).parse(
        await apiRequest<Page<unknown>>(
          getToken,
          cursorPath(`/study-sets/${studySetId}/summaries`, pageParam),
          { signal },
        ),
      ),
    getNextPageParam: (last) => last.nextCursor,
    enabled: Boolean(studySetId),
  });
  return {
    ...query,
    items: query.data?.pages.flatMap((item) => item.data) ?? [],
  };
}
export function useGenerateSummary(studySetId: string) {
  const { getToken } = useAuth();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async () =>
      summaryResultSchema.parse(
        await apiRequest(
          getToken,
          `/study-sets/${studySetId}/summary`,
          { method: "POST" },
          AI_REQUEST_TIMEOUT_MS,
        ),
      ),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: keys.summaries(studySetId) }),
  });
}

export function useDecks(studySetId: string) {
  const { getToken } = useAuth();
  const query = useInfiniteQuery({
    queryKey: keys.decks(studySetId),
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam, signal }) =>
      page(deckSchema).parse(
        await apiRequest<Page<unknown>>(
          getToken,
          cursorPath(`/study-sets/${studySetId}/decks`, pageParam),
          { signal },
        ),
      ),
    getNextPageParam: (last) => last.nextCursor,
    enabled: Boolean(studySetId),
  });
  return {
    ...query,
    items: query.data?.pages.flatMap((item) => item.data) ?? [],
  };
}
export function useGenerateFlashcards(studySetId: string) {
  const { getToken } = useAuth();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (count: number) =>
      flashcardResultSchema.parse(
        await apiRequest(
          getToken,
          `/study-sets/${studySetId}/flashcards`,
          { method: "POST", body: JSON.stringify({ count }) },
          AI_REQUEST_TIMEOUT_MS,
        ),
      ),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: keys.decks(studySetId) }),
  });
}
export function useDeck(studySetId: string, deckId: string) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: keys.deck(studySetId, deckId),
    queryFn: async () =>
      deckWithCardsSchema.parse(
        await apiRequest<DeckWithCards>(
          getToken,
          `/study-sets/${studySetId}/decks/${deckId}`,
        ),
      ),
    enabled: Boolean(studySetId && deckId),
  });
}

export function useConversations(studySetId: string) {
  const { getToken } = useAuth();
  const query = useInfiniteQuery({
    queryKey: keys.conversations(studySetId),
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam, signal }) =>
      page(conversationSchema).parse(
        await apiRequest<Page<unknown>>(
          getToken,
          cursorPath(
            `/conversations?studySetId=${encodeURIComponent(studySetId)}`,
            pageParam,
          ),
          { signal },
        ),
      ),
    getNextPageParam: (last) => last.nextCursor,
    enabled: Boolean(studySetId),
  });
  return {
    ...query,
    items: query.data?.pages.flatMap((item) => item.data) ?? [],
  };
}
export function useConversation(studySetId: string) {
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async () =>
      conversationSchema.parse(
        await apiRequest(getToken, "/conversations", {
          method: "POST",
          body: JSON.stringify({ studySetId }),
        }),
      ),
  });
}
export function useDeleteConversation(studySetId: string) {
  const { getToken } = useAuth();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest<void>(getToken, `/conversations/${id}`, { method: "DELETE" }),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: keys.conversations(studySetId) }),
  });
}
export function useMessages(conversationId: string) {
  const { getToken } = useAuth();
  const query = useInfiniteQuery({
    queryKey: keys.messages(conversationId),
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam, signal }) =>
      page(messageSchema).parse(
        await apiRequest<Page<unknown>>(
          getToken,
          cursorPath(
            `/conversations/${conversationId}/messages?order=desc`,
            pageParam,
          ),
          { signal },
        ),
      ),
    getNextPageParam: (last) => last.nextCursor,
    enabled: Boolean(conversationId),
  });
  return {
    ...query,
    items: (query.data?.pages.flatMap((item) => item.data) ?? []).sort(
      (a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0),
    ),
  };
}

export function useSendMessage(conversationId: string) {
  const { getToken } = useAuth();
  const client = useQueryClient();
  const [streamingReply, setStreamingReply] = useState("");
  const streamController = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      streamController.current?.abort();
    },
    [],
  );
  const mutation = useMutation({
    mutationFn: async (message: string) => {
      streamController.current?.abort();
      const controller = new AbortController();
      streamController.current = controller;
      setStreamingReply("");
      let result = "";
      let sources: unknown[] = [];
      try {
        await apiStreamRequest(
          getToken,
          `/conversations/${conversationId}/chat/stream`,
          { message },
          (event) => {
            if (event.type === "token") {
              result += event.text;
              setStreamingReply(result);
            }
            if (event.type === "sources") sources = event.sources;
            if (event.type === "done") {
              result = event.reply;
              sources = event.sources;
              setStreamingReply(result);
            }
            if (event.type === "error") throw new Error(event.error);
          },
          controller.signal,
        );
        return chatResultSchema.parse({ reply: result, sources });
      } finally {
        if (streamController.current === controller)
          streamController.current = null;
      }
    },
    onSuccess: async () => {
      await client.invalidateQueries({
        queryKey: keys.messages(conversationId),
      });
      setStreamingReply("");
    },
    onError: () => setStreamingReply(""),
  });
  return { ...mutation, streamingReply };
}
