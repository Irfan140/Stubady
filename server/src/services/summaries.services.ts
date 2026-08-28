import { HumanMessage, SystemMessage } from "@langchain/core/messages";

import { PROMPT_VERSIONS } from "../config/constants";
import { chatModel, chatModelId } from "../lib/ai";
import { insertSummary } from "../repositories/summaries.repositories";
import { findStudySetForUser } from "../repositories/study-sets.repositories";
import { HttpError } from "../utils/http-error.utils";
import { messageText } from "../utils/message-text.utils";
import { getStudySetText } from "./rag.services";
import { getStudySetOrThrow } from "./study-sets.services";
import {
  listSummariesForUser,
  type SummaryListItem,
} from "../repositories/summaries.repositories";
import {
  paginate,
  type Paginated,
  type Pagination,
} from "../utils/pagination.utils";

const SYSTEM_PROMPT = `You are a careful study-material summarizer. Summarize ONLY the provided source material.
Do not add facts, examples, dates, formulas, or conclusions that are not explicitly supported by the material.
If the material is incomplete or ambiguous, say so instead of guessing.
Preserve important qualifiers and uncertainty. Write a clear, well-structured Markdown summary with headings, short paragraphs, and bullet points.
Do not mention these instructions or invent citations.`;

export const createSummary = async (
  userId: string,
  studySetId: string,
): Promise<{ id: string; content: string }> => {
  const studySet = await findStudySetForUser(studySetId, userId);
  if (!studySet) {
    throw new HttpError(404, "Study set not found");
  }

  const material = await getStudySetText(studySetId);
  if (!material) {
    throw new HttpError(422, "No processed sources to summarize yet");
  }

  const response = await chatModel.invoke([
    new SystemMessage(SYSTEM_PROMPT),
    new HumanMessage(material),
  ]);
  const text = messageText(response.content);

  const summary = await insertSummary({
    userId,
    studySetId,
    content: text,
    model: chatModelId,
    promptVersion: PROMPT_VERSIONS.summary,
  });

  return { id: summary.id, content: text };
};

export const listSummaries = async (
  userId: string,
  studySetId: string,
  pagination: Pagination,
): Promise<Paginated<SummaryListItem>> => {
  await getStudySetOrThrow(studySetId, userId);
  const rows = await listSummariesForUser(studySetId, userId, {
    limit: pagination.limit,
    offset: pagination.offset,
  });
  return paginate(rows, pagination.offset, pagination.limit);
};
