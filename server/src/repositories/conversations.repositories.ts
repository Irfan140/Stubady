import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../lib/prisma";

export type ConversationRecord = {
  id: string;
  study_set_id: string;
};

export type ChatRole = "user" | "assistant";

export type MessageRecord = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: Date;
};

export const findConversationForUser = async (
  conversationId: string,
  userId: string,
): Promise<ConversationRecord | null> => {
  const row = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
    select: { id: true, studySetId: true },
  });

  if (!row) return null;
  return { id: row.id, study_set_id: row.studySetId };
};

export const insertMessage = async (input: {
  conversationId: string;
  role: ChatRole;
  content: string;
  metadata?: Prisma.InputJsonObject;
}): Promise<void> => {
  await prisma.message.create({
    data: {
      conversationId: input.conversationId,
      role: input.role,
      content: input.content,
      metadata: input.metadata,
    },
  });
};

export const listRecentMessages = async (
  conversationId: string,
  limit: number,
): Promise<MessageRecord[]> => {
  const rows = await prisma.message.findMany({
    where: { conversationId },
    select: { id: true, role: true, content: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return rows.map((row) => ({
    id: row.id,
    role: row.role as ChatRole,
    content: row.content,
    createdAt: row.createdAt,
  }));
};

export const touchConversation = async (
  conversationId: string,
): Promise<void> => {
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });
};

export const createConversation = async (input: {
  userId: string;
  studySetId: string;
}): Promise<ConversationRecord> => {
  const row = await prisma.conversation.create({
    data: { userId: input.userId, studySetId: input.studySetId },
    select: { id: true, studySetId: true },
  });
  return { id: row.id, study_set_id: row.studySetId };
};

export type ConversationListItem = ConversationRecord & {
  createdAt: Date;
  updatedAt: Date;
};

export const listConversationsForUser = async (
  studySetId: string,
  userId: string,
  pagination: { limit: number; offset: number },
): Promise<ConversationListItem[]> => {
  const rows = await prisma.conversation.findMany({
    where: { studySetId, userId },
    select: { id: true, studySetId: true, createdAt: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: pagination.limit + 1,
    skip: pagination.offset,
  });
  return rows.map((row) => ({
    id: row.id,
    study_set_id: row.studySetId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
};

export const listAllMessages = async (
  conversationId: string,
  pagination: { limit: number; offset: number; order: "asc" | "desc" },
): Promise<MessageRecord[]> => {
  const rows = await prisma.message.findMany({
    where: { conversationId },
    select: { id: true, role: true, content: true, createdAt: true },
    orderBy: { createdAt: pagination.order },
    take: pagination.limit + 1,
    skip: pagination.offset,
  });
  return rows.map((row) => ({
    id: row.id,
    role: row.role as ChatRole,
    content: row.content,
    createdAt: row.createdAt,
  }));
};

export const deleteConversationForUser = async (
  conversationId: string,
  userId: string,
): Promise<boolean> => {
  const res = await prisma.conversation.deleteMany({
    where: { id: conversationId, userId },
  });
  return res.count > 0;
};
