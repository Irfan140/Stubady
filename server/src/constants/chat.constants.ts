/** Chat roles and history/context budgets. */

export const CHAT_ROLES = {
  user: "user",
  assistant: "assistant",
} as const;

export const CHAT_LIMITS = {
  historyMessages: 10,
  maxHistoryTokens: 1500,
  maxContextTokens: 6000,
} as const;
