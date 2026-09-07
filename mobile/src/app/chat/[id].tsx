import { zodResolver } from "@hookform/resolvers/zod";
import { Stack, useLocalSearchParams } from "expo-router";
import { SymbolView } from "expo-symbols";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { z } from "zod";

import { ErrorState, LoadingState, styles as ui } from "@/components/ui";
import { useMessages, useSendMessage } from "@/features/study/api";
import type { Message } from "@/features/study/types";
import { hapticLight } from "@/lib/haptics";
import { palette, radius, shadow } from "@/theme";

const schema = z.object({
  message: z.string().trim().min(1, "Ask a question"),
});

function formatTime(value: Message["createdAt"]) {
  try {
    if (value == null) return "";
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

const ChatBubble = memo(function ChatBubble({
  item,
  streaming,
}: {
  item: Message;
  streaming?: boolean;
}) {
  const isUser = item.role === "user";
  return (
    <View style={[styles.messageRow, isUser && styles.userRow]}>
      {!isUser ? (
        <View style={styles.assistantAvatar}>
          <SymbolView
            name={{ android: "auto_awesome", ios: "sparkles" }}
            tintColor={palette.primary}
            size={16}
          />
        </View>
      ) : null}
      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.assistantBubble,
        ]}
      >
        <Text style={[styles.role, isUser && styles.userRole]}>
          {isUser ? "You" : "Studbady"}
          {formatTime(item.createdAt)
            ? `  ·  ${formatTime(item.createdAt)}`
            : ""}
        </Text>
        <Text selectable style={[styles.message, isUser && styles.userMessage]}>
          {item.content}
          {streaming ? <Text style={styles.cursor}> ▍</Text> : null}
        </Text>
      </View>
    </View>
  );
});

export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const messages = useMessages(id);
  const send = useSendMessage(id);
  const form = useForm<{ message: string }>({
    resolver: zodResolver(schema),
    defaultValues: { message: "" },
  });
  const draft = form.watch("message");
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);

  // Drop optimistic copies once the server echo arrives — keyed on content so
  // a slow refetch never makes a sent message flicker away.
  useEffect(() => {
    if (optimisticMessages.length === 0) return;
    const allPersisted = optimisticMessages.every((optimistic) =>
      messages.items.some(
        (item) =>
          item.role === optimistic.role && item.content === optimistic.content,
      ),
    );
    if (allPersisted) setOptimisticMessages([]);
  }, [messages.items, optimisticMessages]);

  const displayMessages = useMemo<Message[]>(() => {
    const merged: Message[] = [...messages.items];
    for (const message of optimisticMessages) {
      const alreadyPersisted = merged.some(
        (item) =>
          item.role === message.role && item.content === message.content,
      );
      if (!alreadyPersisted) merged.push(message);
    }
    if (send.streamingReply) {
      merged.push({
        id: "streaming-reply",
        role: "assistant",
        content: send.streamingReply,
        createdAt: new Date(),
      });
    }
    return merged;
  }, [messages.items, optimisticMessages, send.streamingReply]);

  // Inverted = newest at the visual bottom with no scroll-to-end timers, so
  // streaming + keyboard stay smooth.
  const invertedData = useMemo(
    () => [...displayMessages].reverse(),
    [displayMessages],
  );

  const submit = useCallback(
    async ({ message }: { message: string }) => {
      const text = message.trim();
      if (!text || send.isPending) return;
      hapticLight();
      const optimisticMessage: Message = {
        id: `optimistic-${Date.now()}`,
        role: "user",
        content: text,
        createdAt: new Date(),
      };
      setOptimisticMessages((current) => [...current, optimisticMessage]);
      form.reset();
      try {
        const result = await send.mutateAsync(text);
        setOptimisticMessages([
          optimisticMessage,
          {
            id: `optimistic-reply-${Date.now()}`,
            role: "assistant",
            content: result.reply,
            createdAt: new Date(),
          },
        ]);
      } catch {
        setOptimisticMessages((current) =>
          current.filter((item) => item.id !== optimisticMessage.id),
        );
      }
    },
    // mutateAsync is stable; isPending gates double-taps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form, send.mutateAsync, send.isPending],
  );

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = messages;
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (messages.isPending) return <LoadingState label="Loading conversation…" />;
  if (messages.isError)
    return (
      <ErrorState
        message={messages.error.message}
        onRetry={() => {
          void messages.refetch();
        }}
      />
    );

  const canSend = draft.trim().length > 0 && !send.isPending;

  return (
    <SafeAreaView edges={["bottom"]} style={ui.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "android" ? "height" : "padding"}
        keyboardVerticalOffset={90}
      >
        <Stack.Screen options={{ title: "Study chat" }} />
        <FlatList
          inverted
          contentInsetAdjustmentBehavior="automatic"
          automaticallyAdjustKeyboardInsets
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
          removeClippedSubviews
          initialNumToRender={20}
          maxToRenderPerBatch={12}
          windowSize={7}
          updateCellsBatchingPeriod={50}
          contentContainerStyle={[styles.listContent, { paddingBottom: 12 }]}
          data={invertedData}
          keyExtractor={(item) => item.id}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}>
                <SymbolView
                  name={{
                    android: "chat_bubble",
                    ios: "bubble.left.and.bubble.right",
                  }}
                  tintColor={palette.primary}
                  size={28}
                />
              </View>
              <Text style={styles.emptyTitle}>Ask your study buddy</Text>
              <Text style={styles.emptyText}>
                Ask anything about your processed study material — summaries,
                key ideas, or exam-style practice.
              </Text>
            </View>
          }
          ListHeaderComponent={
            send.isPending && !send.streamingReply ? (
              <View style={styles.typingRow}>
                <View style={styles.assistantAvatar}>
                  <ActivityIndicator size="small" color={palette.primary} />
                </View>
                <View style={[styles.bubble, styles.assistantBubble]}>
                  <Text style={styles.typingText}>Thinking…</Text>
                </View>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <ChatBubble item={item} streaming={item.id === "streaming-reply"} />
          )}
        />
        <View
          style={[
            styles.composer,
            { paddingBottom: Math.max(insets.bottom, 12) },
          ]}
        >
          <Controller
            control={form.control}
            name="message"
            render={({ field, fieldState }) => (
              <View style={styles.inputWrap}>
                <View
                  style={[
                    styles.inputBox,
                    fieldState.error && styles.inputBoxError,
                  ]}
                >
                  <TextInput
                    multiline
                    style={styles.input}
                    placeholder="Ask about your notes…"
                    placeholderTextColor={palette.faint}
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    returnKeyType="send"
                    blurOnSubmit={false}
                    onSubmitEditing={() => {
                      void form.handleSubmit(submit)();
                    }}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Send message"
                    accessibilityState={{ disabled: !canSend }}
                    disabled={!canSend}
                    hitSlop={8}
                    onPress={form.handleSubmit(submit)}
                    style={({ pressed }) => [
                      styles.sendButton,
                      !canSend && styles.sendButtonDisabled,
                      pressed && canSend && styles.sendButtonPressed,
                    ]}
                  >
                    {send.isPending ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <SymbolView
                        name={{ android: "arrow_upward", ios: "arrow.up" }}
                        tintColor="#FFFFFF"
                        size={20}
                      />
                    )}
                  </Pressable>
                </View>
                {fieldState.error?.message ? (
                  <Text style={styles.error}>{fieldState.error.message}</Text>
                ) : null}
              </View>
            )}
          />
        </View>
        {send.isError ? (
          <Text style={styles.sendError} selectable>
            {send.error.message}
          </Text>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingTop: 16, gap: 12, flexGrow: 1 },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingRight: 44,
  },
  userRow: { justifyContent: "flex-end", paddingRight: 0, paddingLeft: 44 },
  assistantAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.primarySoft,
    borderWidth: 1,
    borderColor: palette.line,
    marginBottom: 2,
  },
  bubble: {
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 12,
    gap: 4,
    maxWidth: "100%",
  },
  userBubble: {
    backgroundColor: palette.primary,
    borderBottomRightRadius: 8,
    ...shadow.raised,
  },
  assistantBubble: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.line,
    borderBottomLeftRadius: 8,
    ...shadow.card,
  },
  role: {
    color: palette.faint,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  userRole: { color: "rgba(255,255,255,0.75)" },
  message: { color: palette.ink, fontSize: 16, lineHeight: 23 },
  userMessage: { color: "#FFFFFF" },
  cursor: { color: palette.primary, fontWeight: "800" },
  typingRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  typingText: { color: palette.muted, fontSize: 14, fontStyle: "italic" },
  emptyWrap: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 56,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: palette.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    color: palette.ink,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyText: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  composer: {
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.surface,
  },
  inputWrap: { gap: 4 },
  inputBox: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    backgroundColor: palette.bg,
    borderWidth: 1.5,
    borderColor: palette.line,
    borderRadius: radius.xl,
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 8,
  },
  inputBoxError: { borderColor: palette.danger },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 36,
    paddingVertical: 6,
    color: palette.ink,
    fontSize: 16,
    lineHeight: 22,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.primary,
    ...shadow.raised,
  },
  sendButtonDisabled: { opacity: 0.4, boxShadow: "none" },
  sendButtonPressed: {
    backgroundColor: palette.primaryDeep,
    transform: [{ scale: 0.93 }],
  },
  error: { color: palette.danger, fontSize: 12, paddingLeft: 16 },
  sendError: {
    color: palette.danger,
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: palette.surface,
  },
});
