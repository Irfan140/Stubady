import type { MessageContent } from "@langchain/core/messages";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";

import { CHAT_LIMITS, CHAT_ROLES, PROMPT_VERSIONS } from "../config/constants";
import { chatModel } from "../lib/ai";
import {
  findConversationForUser,
  insertMessage,
  listRecentMessages,
  touchConversation,
} from "../repositories/conversations.repositories";
import type { MatchedChunk } from "../repositories/source-chunks.repositories";
import { HttpError } from "../utils/http-error.utils";
import { messageText } from "../utils/message-text.utils";
import {
  estimateTokens,
  truncateToTokenBudget,
} from "../utils/token-estimate.utils";
import { retrieveContext } from "./rag.services";

const SYSTEM_PROMPT = `You are a helpful study assistant. Answer the student's question using the provided context from their study materials.
If the context does not contain the answer, say so honestly and answer from general knowledge only if appropriate.
Be concise and clear.`;

/**
 * LangGraph state for the study-chat flow:
 * START → retrieve (pgvector context) → generate (LLM reply) → END
 *
 * New nodes (e.g. rerank, guardrails, tool calls, quiz generation) can be
 * slotted between retrieve and generate as the app becomes more agentic.
 */
const StudyChatState = Annotation.Root({
  question: Annotation<string>,
  studySetId: Annotation<string>,
  context: Annotation<string>({ reducer: (_, b) => b, default: () => "" }),
  history: Annotation<BaseMessage[]>({
    reducer: (_, b) => b,
    default: () => [],
  }),
  sources: Annotation<MatchedChunk[]>({
    reducer: (_, b) => b,
    default: () => [],
  }),
  answer: Annotation<string>({ reducer: (_, b) => b, default: () => "" }),
});

const retrieveFromPgVector = async (
  state: typeof StudyChatState.State,
): Promise<{ context: string; sources: MatchedChunk[] }> => {
  const matches = await retrieveContext(state.studySetId, state.question);
  return {
    context: matches.map((m) => m.content).join("\n\n---\n\n"),
    sources: matches,
  };
};

type RetrieveNode = (
  state: typeof StudyChatState.State,
) => Promise<{ context: string; sources: MatchedChunk[] }>;

/**
 * Builds the compiled study-chat graph. Model and retriever are injectable so
 * tests can substitute fakes without touching the graph wiring.
 */
export const buildStudyChatGraph = (
  model: BaseChatModel = chatModel,
  retrieve: RetrieveNode = retrieveFromPgVector,
) => {
  const generate = async (state: typeof StudyChatState.State) => {
    const context = truncateToTokenBudget(
      state.context,
      CHAT_LIMITS.maxContextTokens,
    );
    const system = context
      ? `${SYSTEM_PROMPT}\n\nContext:\n${context}`
      : SYSTEM_PROMPT;

    const response = await model.invoke([
      new SystemMessage(system),
      ...state.history,
      new HumanMessage(state.question),
    ]);

    return { answer: messageText(response.content) };
  };

  const workflow = new StateGraph(StudyChatState)
    .addNode("retrieve", retrieve)
    .addNode("generate", generate)
    .addEdge(START, "retrieve")
    .addEdge("retrieve", "generate")
    .addEdge("generate", END);

  return workflow.compile();
};

const studyChatGraph = buildStudyChatGraph();

const buildHistoryMessages = (
  rows: Array<{ role: string; content: string }>,
): BaseMessage[] =>
  rows.map((m) =>
    m.role === CHAT_ROLES.user
      ? new HumanMessage(m.content)
      : new AIMessage(m.content),
  );

const trimHistoryToBudget = (history: BaseMessage[]): BaseMessage[] => {
  const totalTokens = (msgs: BaseMessage[]): number =>
    msgs.reduce((sum, m) => sum + estimateTokens(messageText(m.content)), 0);

  let kept = [...history];
  while (kept.length > 0 && totalTokens(kept) > CHAT_LIMITS.maxHistoryTokens) {
    kept = kept.slice(1);
  }
  return kept;
};

export type ChatStreamEvent =
  | { type: "token"; text: string }
  | { type: "sources"; sources: MatchedChunk[] }
  | { type: "done"; reply: string; sources: MatchedChunk[] };

/**
 * Stores the user message, runs the RAG graph (retrieve + generate), then
 * persists the assistant reply alongside the matched chunk ids.
 */
export const generateReply = async (
  userId: string,
  conversationId: string,
  message: string,
  signal?: AbortSignal,
): Promise<{ reply: string; sources: MatchedChunk[] }> => {
  const conversation = await findConversationForUser(conversationId, userId);
  if (!conversation) {
    throw new HttpError(404, "Conversation not found");
  }

  const historyRows = (
    await listRecentMessages(conversationId, CHAT_LIMITS.historyMessages)
  ).reverse();
  const history = trimHistoryToBudget(buildHistoryMessages(historyRows));

  await insertMessage({
    conversationId,
    role: CHAT_ROLES.user,
    content: message,
  });

  const result = await studyChatGraph.invoke(
    {
      question: message,
      studySetId: conversation.study_set_id,
      history,
    },
    { signal },
  );

  await insertMessage({
    conversationId,
    role: CHAT_ROLES.assistant,
    content: result.answer,
    metadata: {
      sources: result.sources.map((s) => s.id),
      promptVersion: PROMPT_VERSIONS.chat,
    },
  });

  await touchConversation(conversationId);

  return { reply: result.answer, sources: result.sources };
};

/**
 * Streaming variant of {@link generateReply}: yields SSE-ready events —
 * matched sources first, then LLM token deltas, then a final `done` event
 * once the exchange has been persisted.
 */
export const streamReply = async function* (
  userId: string,
  conversationId: string,
  message: string,
  signal?: AbortSignal,
): AsyncGenerator<ChatStreamEvent> {
  const conversation = await findConversationForUser(conversationId, userId);
  if (!conversation) {
    throw new HttpError(404, "Conversation not found");
  }

  const historyRows = (
    await listRecentMessages(conversationId, CHAT_LIMITS.historyMessages)
  ).reverse();
  const history = trimHistoryToBudget(buildHistoryMessages(historyRows));

  await insertMessage({
    conversationId,
    role: CHAT_ROLES.user,
    content: message,
  });

  const stream = await studyChatGraph.stream(
    {
      question: message,
      studySetId: conversation.study_set_id,
      history,
    },
    // `messages` streams LLM token deltas; `updates` surfaces node outputs
    // (sources from retrieve, final answer from generate). `signal` aborts
    // generation when the client disconnects mid-stream.
    { streamMode: ["messages", "updates"], signal },
  );

  let sources: MatchedChunk[] = [];
  let answer = "";
  let streamedText = "";
  let persisted = false;

  const persist = async (text: string): Promise<void> => {
    if (persisted) return;
    persisted = true;
    await insertMessage({
      conversationId,
      role: CHAT_ROLES.assistant,
      content: text,
      metadata: {
        sources: sources.map((s) => s.id),
        promptVersion: PROMPT_VERSIONS.chat,
      },
    });
    await touchConversation(conversationId);
  };

  try {
    for await (const entry of stream) {
      const [mode, payload] = entry as [string, unknown];

      if (mode === "messages") {
        const [chunk] = payload as [{ content?: MessageContent }, unknown];
        const text = chunk?.content ? messageText(chunk.content) : "";
        if (text) {
          streamedText += text;
          yield { type: "token", text };
        }
        continue;
      }

      if (mode === "updates") {
        const updates = payload as Record<
          string,
          { context?: string; sources?: MatchedChunk[]; answer?: string }
        >;
        if (updates.retrieve?.sources) {
          sources = updates.retrieve.sources;
          yield { type: "sources", sources };
        }
        if (updates.generate?.answer) answer = updates.generate.answer;
      }
    }

    const reply = answer || streamedText;
    await persist(reply);
    yield { type: "done", reply, sources };
  } finally {
    if (!persisted && streamedText) {
      await persist(streamedText);
    }
  }
};
