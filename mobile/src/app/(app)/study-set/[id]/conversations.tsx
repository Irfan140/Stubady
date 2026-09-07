import { Link, Stack, router, useLocalSearchParams } from "expo-router";
import { SymbolView } from "expo-symbols";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  styles as ui,
} from "@/components/ui";
import {
  useConversation,
  useConversations,
  useDeleteConversation,
} from "@/features/study/api";
import type { Conversation } from "@/features/study/types";

export default function Conversations() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const query = useConversations(id);
  const create = useConversation(id);
  if (query.isPending) return <LoadingState />;
  if (query.isError)
    return (
      <ErrorState
        message={query.error.message}
        onRetry={() => {
          void query.refetch();
        }}
      />
    );
  const start = async () => {
    try {
      const conversation = await create.mutateAsync();
      router.push({
        pathname: "/chat/[id]",
        params: { id: conversation.id, studySetId: id },
      });
    } catch (error) {
      Alert.alert(
        "Unable to start chat",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  };
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        style={ui.screen}
        contentContainerStyle={[
          ui.content,
          {
            paddingTop: Math.max(insets.top, 12) + 4,
            paddingBottom: Math.max(insets.bottom, 16) + 24,
          },
        ]}
        data={query.items}
        keyExtractor={(item) => item.id}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage)
            void query.fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.navBar}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                hitSlop={12}
                onPress={() => router.back()}
                style={({ pressed }) => [
                  styles.backButton,
                  pressed && styles.pressed,
                ]}
              >
                <SymbolView
                  name={{ ios: "chevron.left", android: "arrow_back" }}
                  tintColor="#0F172A"
                  size={22}
                />
              </Pressable>
              <Text numberOfLines={1} style={styles.navTitle}>
                Chat history
              </Text>
              <View style={styles.navSpacer} />
            </View>
            <Card style={styles.hero}>
              <Text style={styles.eyebrow}>CHATS</Text>
              <Text style={styles.heroTitle}>Chat history</Text>
              <Text style={styles.heroSubtitle}>
                {query.items.length
                  ? `${query.items.length} saved ${query.items.length === 1 ? "conversation" : "conversations"} — tap one to continue.`
                  : "Study chats will appear here."}
              </Text>
              <Button
                title={
                  create.isPending ? "Opening…" : "+ New conversation"
                }
                onPress={() => {
                  void start();
                }}
                disabled={create.isPending}
              />
            </Card>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="No conversations yet"
            message="Start a study chat to ask questions about this study set."
            action={
              <Button
                title="Start a conversation"
                onPress={() => {
                  void start();
                }}
              />
            }
          />
        }
        renderItem={({ item, index }) => (
          <ConversationRow
            item={item}
            index={index}
            studySetId={id}
          />
        )}
      />
    </>
  );
}

function ConversationRow({
  item,
  index,
  studySetId,
}: {
  item: Conversation;
  index: number;
  studySetId: string;
}) {
  const remove = useDeleteConversation(studySetId);
  const confirmDelete = () =>
    Alert.alert(
      "Delete conversation?",
      "This removes its messages. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            remove.mutate(item.id, {
              onError: (error) =>
                Alert.alert(
                  "Unable to delete conversation",
                  error.message,
                ),
            }),
        },
      ],
    );
  return (
    <Link
      href={{
        pathname: "/chat/[id]",
        params: { id: item.id, studySetId },
      }}
      asChild
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open conversation ${index + 1}`}
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        <Card style={styles.item}>
          <View style={styles.row}>
            <View style={styles.iconWrap}>
              <SymbolView
                name={{
                  ios: "bubble.left.and.bubble.right",
                  android: "chat_bubble",
                }}
                tintColor="#4F46E5"
                size={22}
              />
            </View>
            <View style={styles.copy}>
              <View style={styles.metaRow}>
                <Text style={styles.date}>
                  {item.updatedAt?.toLocaleString() ??
                    item.createdAt?.toLocaleString() ??
                    `Chat ${index + 1}`}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Delete conversation ${index + 1}`}
                  hitSlop={10}
                  disabled={remove.isPending}
                  onPress={confirmDelete}
                  style={({ pressed }) => [
                    styles.deleteButton,
                    pressed && styles.pressed,
                    remove.isPending && styles.deleteDisabled,
                  ]}
                >
                  <SymbolView
                    name={{ ios: "trash", android: "delete" }}
                    tintColor="#DC2626"
                    size={18}
                  />
                </Pressable>
              </View>
              <Text style={styles.title}>Study chat</Text>
              <Text style={styles.link}>Open chat ›</Text>
            </View>
            <SymbolView
              name={{ ios: "chevron.right", android: "chevron_right" }}
              tintColor="#94A3B8"
              size={20}
            />
          </View>
        </Card>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  header: { gap: 12, marginBottom: 4 },
  navBar: { flexDirection: "row", alignItems: "center", gap: 8 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6EAF2",
  },
  navTitle: { flex: 1, color: "#0F172A", fontSize: 17, fontWeight: "700" },
  navSpacer: { width: 40 },
  hero: { gap: 6 },
  eyebrow: { color: "#4F46E5", fontSize: 11, fontWeight: "800", letterSpacing: 1.3 },
  heroTitle: { color: "#0F172A", fontSize: 24, fontWeight: "800" },
  heroSubtitle: { color: "#64748B", fontSize: 14, lineHeight: 20 },
  item: { padding: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#EEF0FE",
    alignItems: "center",
    justifyContent: "center",
  },
  copy: { flex: 1, gap: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  date: { flex: 1, color: "#4F46E5", fontSize: 12, fontWeight: "800" },
  title: { color: "#0F172A", fontSize: 17, fontWeight: "800" },
  link: { color: "#4F46E5", fontWeight: "700" },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  deleteDisabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
});
