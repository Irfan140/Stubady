import type { MessageContent } from "@langchain/core/messages";

export const messageText = (content: MessageContent): string => {
  if (typeof content === "string") return content;
  return content
    .map((part) =>
      typeof part === "object" &&
      part !== null &&
      "text" in part &&
      typeof part.text === "string"
        ? part.text
        : "",
    )
    .join("");
};
