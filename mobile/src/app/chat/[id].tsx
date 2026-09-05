import { zodResolver } from "@hookform/resolvers/zod";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { SymbolView } from "expo-symbols";
import { z } from "zod";

import {
  Button,
  ErrorState,
  LoadingState,
  styles as ui,
} from "@/components/ui";
import { useMessages, useSendMessage } from "@/features/study/api";
import type { Message } from "@/features/study/types";

const schema = z.object({
  message: z.string().trim().min(1, "Ask a question"),
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
  const list = useRef<FlatList<Message>>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);

  useEffect(() => {
    const timer = setTimeout(
      () => list.current?.scrollToEnd({ animated: true }),
      send.streamingReply ? 80 : 0,
    );
    return () => clearTimeout(timer);
  }, [messages.items.length, send.streamingReply]);
  // contains them — never on a fixed timer (that race made sent messages
  // vanish whenever the refetch was slower than the timeout).
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

  useEffect(() => {
    const subscription = Keyboard.addListener("keyboardDidShow", () => {
      setTimeout(() => list.current?.scrollToEnd({ animated: true }), 120);
    });
    return () => subscription.remove();
  }, []);

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

  const displayMessages: Message[] = [...messages.items];
  const appendIfMissing = (message: Message) => {
    const alreadyPersisted = displayMessages.some(
      (item) => item.role === message.role && item.content === message.content,
    );
    if (!alreadyPersisted) displayMessages.push(message);
  };
  optimisticMessages.forEach(appendIfMissing);
  if (send.streamingReply)
    appendIfMissing({
      id: "streaming-reply",
      role: "assistant",
      content: send.streamingReply,
      createdAt: new Date(),
    });

  const submit = async ({ message }: { message: string }) => {
    const optimisticMessage: Message = {
      id: `optimistic-${Date.now()}`,
      role: "user",
      content: message,
      createdAt: new Date(),
    };
    setOptimisticMessages((current) => [...current, optimisticMessage]);
    form.reset();
    try {
      const result = await send.mutateAsync(message);
      // Keep the optimistic pair until the effect below sees them persisted
      // in the refetched cache — avoids messages flickering away mid-refetch.
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
  };

  return (
    <SafeAreaView edges={["bottom"]} style={ui.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "android" ? "height" : "padding"}
        keyboardVerticalOffset={90}
      >
        <Stack.Screen options={{ title: "Study chat" }} />
        <FlatList
          ref={list}
          contentInsetAdjustmentBehavior="automatic"
          automaticallyAdjustKeyboardInsets
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={ui.content}
          data={displayMessages}
          keyExtractor={(item) => item.id}
          onEndReached={() => {
            if (messages.hasNextPage && !messages.isFetchingNextPage)
              void messages.fetchNextPage();
          }}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <Text style={ui.muted}>
              Ask anything about your processed study material.
            </Text>
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageRow,
                item.role === "user" && styles.userRow,
              ]}
            >
              <View
                style={[
                  styles.avatar,
                  item.role === "user"
                    ? styles.userAvatar
                    : styles.assistantAvatar,
                ]}
              >
                <SymbolView
                  name={{
                    android: item.role === "user" ? "person" : "auto_awesome",
                    ios: item.role === "user" ? "person.fill" : "sparkles",
                  }}
                  tintColor={item.role === "user" ? "#4338CA" : "#7C3AED"}
                  size={18}
                />
              </View>
              <View
                style={[
                  styles.bubble,
                  item.role === "user"
                    ? styles.userBubble
                    : styles.assistantBubble,
                ]}
              >
                <Text style={styles.role}>
                  {item.role === "user" ? "You" : "Studbady"}
                </Text>
                <Text selectable style={styles.message}>
                  {item.content}
                </Text>
              </View>
            </View>
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
                <TextInput
                  multiline
                  style={styles.input}
                  placeholder="Ask about your notes…"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                />
                <Text style={styles.error}>{fieldState.error?.message}</Text>
              </View>
            )}
          />
          <Button
            title="Send"
            loading={send.isPending}
            onPress={form.handleSubmit(submit)}
            disabled={send.isPending}
          />
        </View>
        {send.isError ? (
          <Text style={styles.error} selectable>
            {send.error.message}
          </Text>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  messageRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  userRow: { justifyContent: "flex-end" },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  userAvatar: { backgroundColor: "#DBEAFE" },
  assistantAvatar: { backgroundColor: "#EDE9FE" },
  bubble: { borderRadius: 16, padding: 14, gap: 6, maxWidth: "88%" },
  userBubble: { alignSelf: "flex-end", backgroundColor: "#DBEAFE" },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  role: { color: "#64748B", fontSize: 12, fontWeight: "700" },
  message: { color: "#0F172A", fontSize: 16, lineHeight: 23 },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  inputWrap: { flex: 1 },
  input: {
    maxHeight: 110,
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#0F172A",
  },
  error: { color: "#B91C1C", fontSize: 12, minHeight: 16 },
});
