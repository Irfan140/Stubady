import { TOKEN_CHARS_PER_TOKEN } from "../config/constants";

export const estimateTokens = (text: string): number =>
  Math.ceil(text.length / TOKEN_CHARS_PER_TOKEN);

export const truncateToTokenBudget = (
  text: string,
  maxTokens: number,
): string => {
  const maxChars = maxTokens * TOKEN_CHARS_PER_TOKEN;
  if (text.length <= maxChars) return text;

  const tail = text.slice(text.length - maxChars);
  const firstSpace = tail.indexOf(" ");
  return firstSpace > 0 ? tail.slice(firstSpace + 1) : tail;
};
