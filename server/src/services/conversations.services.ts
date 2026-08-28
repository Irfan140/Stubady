import { CHAT_ROLES } from "../config/constants";
import {
  createConversation as persistConversation,
  deleteConversationForUser,
  findConversationForUser,
  listAllMessages,
  listConversationsForUser,
  type ConversationListItem,
  type ConversationRecord,
  type MessageRecord,
} from "../repositories/conversations.repositories";
import type { CreateConversationInput } from "../schemas/conversations.schemas";
import { HttpError } from "../utils/http-error.utils";
import {
  paginate,
  type Paginated,
  type Pagination,
} from "../utils/pagination.utils";
import { getStudySetOrThrow } from "./study-sets.services";

export const createConversation = async (
  userId: string,
  input: CreateConversationInput,
): Promise<ConversationRecord> => {
  // Owning the study set gates conversation creation.
  await getStudySetOrThrow(input.studySetId, userId);
  return persistConversation({ userId, studySetId: input.studySetId });
};

export const listConversations = async (
  userId: string,
  query: { studySetId: string } & Pagination,
): Promise<Paginated<ConversationListItem>> => {
  await getStudySetOrThrow(query.studySetId, userId);
  const rows = await listConversationsForUser(query.studySetId, userId, {
    limit: query.limit,
    offset: query.offset,
  });
  return paginate(rows, query.offset, query.limit);
};

export const getConversationOrThrow = async (
  conversationId: string,
  userId: string,
): Promise<ConversationRecord> => {
  const conversation = await findConversationForUser(conversationId, userId);
  if (!conversation) throw new HttpError(404, "Conversation not found");
  return conversation;
};

export const listMessages = async (
  userId: string,
  conversationId: string,
  pagination: Pagination & { order: "asc" | "desc" },
): Promise<Paginated<MessageRecord>> => {
  await getConversationOrThrow(conversationId, userId);
  const rows = await listAllMessages(conversationId, {
    limit: pagination.limit,
    offset: pagination.offset,
    order: pagination.order,
  });
  return paginate(rows, pagination.offset, pagination.limit);
};

export const deleteConversation = async (
  userId: string,
  conversationId: string,
): Promise<void> => {
  const deleted = await deleteConversationForUser(conversationId, userId);
  if (!deleted) throw new HttpError(404, "Conversation not found");
};

// Re-export for routes that need role literals in payloads.
export { CHAT_ROLES };
