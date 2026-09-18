import { zodResolver } from "@hookform/resolvers/zod";
import { router, useLocalSearchParams } from "expo-router";
import { SymbolView } from "expo-symbols";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch, type Control } from "react-hook-form";
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

import {
  Chip,
  ErrorState,
  LoadingState,
  TopBar,
  useUiStyles,
} from "@/components/ui";
import {
  useMessages,
  useSendMessage,
  useSources,
  useStudySet,
} from "@/features/study/api";
import type { Message } from "@/features/study/types";
import { hapticLight } from "@/lib/haptics";
import { useTheme } from "@/stores/theme-store";
import { radius, shadow, type Palette } from "@/theme";

const schema = z.object({
  message: z.string().trim().min(1, "Ask a question"),
});

type ChatSource = { id: string; content: string; similarity: number };
type ChatMessage = Message & { sources?: ChatSource[] };

const STARTERS = [
  "Summarize the key ideas in my sources",
  "Quiz me on the most important concepts",
  "What should I focus on for revision?",
];

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

const ChatBubble = memo(function ChatBubble({ item }: { item: ChatMessage }) {
  const { palette } = useTheme();
  const styles = useMemo(() => makeStyles(palette), [palette]);
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
          {isUser ? "You" : "Stubady"}
          {formatTime(item.createdAt)
            ? `  ·  ${formatTime(item.createdAt)}`
            : ""}
        </Text>
        <Text selectable style={[styles.message, isUser && styles.userMessage]}>
          {item.content}
          {item.id === "streaming-reply" ? (
            <Text style={styles.cursor}> ▍</Text>
          ) : null}
        </Text>
        {!isUser && item.sources && item.sources.length > 0 ? (
          <View style={styles.sources}>
            <Text style={styles.sourcesLabel}>
              Grounded in {item.sources.length}{" "}
              {item.sources.length === 1 ? "source" : "sources"}
            </Text>
            <View style={styles.sourceChips}>
              {item.sources.slice(0, 3).map((source) => (
                <Chip
                  key={source.id}
                  label={source.content.replace(/\s+/g, " ").slice(0, 64)}
                />
              ))}
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
});

const Composer = memo(function Composer({
  control,
  isPending,
  bottomInset,
  onSend,
}: {
  control: Control<{ message: string }>;
  isPending: boolean;
  bottomInset: number;
  onSend: () => void;
}) {
  const { palette } = useTheme();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  // Watched here (not in Chat) so the input stays steady while the AI
  // streams above it.
  const draft = useWatch({ control, name: "message" });
  const canSend = draft.trim().length > 0 && !isPending;
  return (
    <View style={[styles.composer, { paddingBottom: bottomInset }]}>
      <Controller
        control={control}
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
                onSubmitEditing={onSend}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Send message"
                accessibilityState={{ disabled: !canSend }}
                disabled={!canSend}
                hitSlop={8}
                onPress={onSend}
                style={({ pressed }) => [
                  styles.sendButton,
                  !canSend && styles.sendButtonDisabled,
                  pressed && canSend && styles.sendButtonPressed,
                ]}
              >
                {isPending ? (
                  <ActivityIndicator size="small" color={palette.primaryInk} />
                ) : (
                  <SymbolView
                    name={{ android: "arrow_upward", ios: "arrow.up" }}
                    tintColor={palette.primaryInk}
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
  );
});

export default function Chat() {
  const { palette } = useTheme();
  const ui = useUiStyles();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const { id, studySetId } = useLocalSearchParams<{
    id: string;
    studySetId: string;
  }>();
  const insets = useSafeAreaInsets();
  const messages = useMessages(id);
  const send = useSendMessage(id);
  const set = useStudySet(studySetId);
  const sources = useSources(studySetId);
  const form = useForm<{ message: string }>({
    resolver: zodResolver(schema),
    defaultValues: { message: "" },
  });
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessage[]>(
    [],
  );
  // Sources arrive with the send result, not with persisted history. Keyed
  // by reply text so the fresh reply keeps its citations after refetch.
  const [freshSources, setFreshSources] = useState<
    Record<string, ChatSource[]>
  >({});

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

  const displayMessages = useMemo<ChatMessage[]>(() => {
    const merged: ChatMessage[] = messages.items.map((item) => ({
      ...item,
      sources:
        item.role === "assistant" ? freshSources[item.content] : undefined,
    }));
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
  }, [messages.items, optimisticMessages, send.streamingReply, freshSources]);

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
      const optimisticMessage: ChatMessage = {
        id: `optimistic-${Date.now()}`,
        role: "user",
        content: text,
        createdAt: new Date(),
      };
      setOptimisticMessages((current) => [...current, optimisticMessage]);
      form.reset();
      try {
        const result = await send.mutateAsync(text);
        setFreshSources((current) => ({
          ...current,
          [result.reply]: (result.sources ?? []) as ChatSource[],
        }));
        setOptimisticMessages([
          optimisticMessage,
          {
            id: `optimistic-reply-${Date.now()}`,
            role: "assistant",
            content: result.reply,
            createdAt: new Date(),
            sources: (result.sources ?? []) as ChatSource[],
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
  const handleSend = useCallback(() => {
    void form.handleSubmit(submit)();
  }, [form, submit]);
  const askStarter = useCallback(
    (starter: string) => {
      form.setValue("message", starter);
      void form.handleSubmit(submit)();
    },
    [form, submit],
  );

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

  const readyCount = sources.items.filter((s) => s.status === "ready").length;

  return (
    <SafeAreaView edges={["top", "bottom"]} style={ui.screen}>
      <View
        style={[
          ui.content,
          { paddingBottom: 8, paddingTop: Math.max(insets.top, 8) },
        ]}
      >
        <TopBar
          title={set.data?.title ?? "Study chat"}
          onBack={() =>
            studySetId
              ? router.replace({
                  pathname: "/(app)/study-set/[id]",
                  params: { id: studySetId },
                })
              : router.back()
          }
        />
        {readyCount > 0 ? (
          <Text style={styles.context}>
            Answering from {readyCount} ready{" "}
            {readyCount === 1 ? "source" : "sources"} in this set
          </Text>
        ) : null}
      </View>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "android" ? "height" : "padding"}
      >
        <FlatList
          inverted
          contentInsetAdjustmentBehavior="automatic"
          automaticallyAdjustKeyboardInsets
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
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
              <Text style={styles.emptyTitle}>
                Ask about {set.data?.title ?? "this set"}
              </Text>
              <Text style={styles.emptyText}>
                Answers come only from ready material in this set — with the
                source attached, so you can verify.
              </Text>
              <View style={styles.starters}>
                {STARTERS.map((starter) => (
                  <Pressable
                    key={starter}
                    accessibilityRole="button"
                    accessibilityLabel={`Ask: ${starter}`}
                    onPress={() => askStarter(starter)}
                    style={({ pressed }) => [
                      styles.starter,
                      pressed && styles.starterPressed,
                    ]}
                  >
                    <Text style={styles.starterText}>{starter}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          }
          ListHeaderComponent={
            send.isPending && !send.streamingReply ? (
              <View style={styles.typingRow}>
                <View style={styles.assistantAvatar}>
                  <ActivityIndicator size="small" color={palette.primary} />
                </View>
                <View style={[styles.bubble, styles.assistantBubble]}>
                  <Text style={styles.typingText}>Reading your sources…</Text>
                </View>
              </View>
            ) : null
          }
          renderItem={({ item }) => <ChatBubble item={item} />}
        />
        <Composer
          control={form.control}
          isPending={send.isPending}
          bottomInset={Math.max(insets.bottom, 12)}
          onSend={handleSend}
        />
        {send.isError ? (
          <Text style={styles.sendError} selectable>
            {send.error.message}
          </Text>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    flex: { flex: 1 },
    context: {
      color: palette.muted,
      fontSize: 13,
      lineHeight: 18,
      paddingHorizontal: 4,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingTop: 8,
      gap: 12,
      flexGrow: 1,
    },
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
      borderRadius: radius.lg,
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 6,
      maxWidth: "100%",
    },
    userBubble: {
      backgroundColor: palette.primary,
      ...shadow.raised,
    },
    assistantBubble: {
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.line,
    },
    role: {
      color: palette.faint,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.4,
    },
    userRole: { color: palette.primaryInk },
    message: { color: palette.ink, fontSize: 16, lineHeight: 23 },
    userMessage: { color: palette.primaryInk },
    cursor: { color: palette.primary, fontWeight: "800" },
    sources: { gap: 6, paddingTop: 4 },
    sourcesLabel: { color: palette.primary, fontSize: 12, fontWeight: "800" },
    sourceChips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    typingRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
    typingText: { color: palette.muted, fontSize: 14, fontStyle: "italic" },
    emptyWrap: {
      alignItems: "center",
      gap: 10,
      paddingVertical: 32,
      paddingHorizontal: 24,
    },
    emptyIcon: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: palette.pool,
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
    starters: { gap: 8, marginTop: 8, width: "100%" },
    starter: {
      minHeight: 48,
      justifyContent: "center",
      paddingHorizontal: 16,
      borderRadius: radius.md,
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.line,
    },
    starterPressed: { opacity: 0.7 },
    starterText: { color: palette.ink, fontSize: 14, fontWeight: "600" },
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
      backgroundColor: palette.inputBg,
      borderWidth: 1,
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
    sendButtonPressed: { opacity: 0.85, transform: [{ scale: 0.93 }] },
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
