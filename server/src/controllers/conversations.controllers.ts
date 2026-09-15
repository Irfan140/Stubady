import type { Request, Response } from "express";

import {
  createConversation as createConversationService,
  deleteConversation as deleteConversationService,
  listConversations as listConversationsService,
  listMessages as listMessagesService,
} from "../services/conversations.services";
import { parsePagination } from "../utils/pagination.utils";

export const createConversation = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const conversation = await createConversationService(req.userId!, req.body);
  res.status(201).json(conversation);
};

export const listConversations = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const query = req.query as {
    studySetId: string;
    limit?: string;
    cursor?: string;
  };
  const result = await listConversationsService(req.userId!, {
    studySetId: query.studySetId,
    ...parsePagination(query),
  });
  res.json(result);
};

export const listMessages = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const query = req.query as {
    limit?: string;
    cursor?: string;
    order?: "asc" | "desc";
  };
  const result = await listMessagesService(
    req.userId!,
    req.params.id as string,
    {
      ...parsePagination(query),
      order: query.order ?? "asc",
    },
  );
  res.json(result);
};

export const deleteConversation = async (
  req: Request,
  res: Response,
): Promise<void> => {
  await deleteConversationService(req.userId!, req.params.id as string);
  res.status(204).end();
};
