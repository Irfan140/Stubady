import { Link, Stack, router, useLocalSearchParams } from "expo-router";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

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

export default function Conversations() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useConversations(id);
  const create = useConversation(id);
  const remove = useDeleteConversation(id);
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
      <Stack.Screen options={{ title: "Chat history" }} />
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        style={ui.screen}
        contentContainerStyle={ui.content}
        data={query.items}
        keyExtractor={(item) => item.id}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage)
            void query.fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <Button
            title={create.isPending ? "Opening…" : "＋ New conversation"}
            onPress={() => {
              void start();
            }}
            disabled={create.isPending}
          />
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
        renderItem={({ item }) => (
          <View>
            <Link
              href={{
                pathname: "/chat/[id]",
                params: { id: item.id, studySetId: id },
              }}
              asChild
            >
              <Pressable>
                <Card>
                  <Text style={styles.title}>Study chat</Text>
                  <Text style={ui.muted}>
                    {item.updatedAt?.toLocaleString() ?? "Conversation"}
                  </Text>
                </Card>
              </Pressable>
            </Link>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Delete conversation"
              onPress={() =>
                Alert.alert(
                  "Delete conversation?",
                  "This removes its messages.",
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
                )
              }
            >
              <Text style={styles.delete}>Delete</Text>
            </Pressable>
          </View>
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  title: { color: "#0F172A", fontSize: 18, fontWeight: "700" },
  delete: {
    color: "#B91C1C",
    fontWeight: "700",
    paddingHorizontal: 18,
    paddingBottom: 8,
    paddingTop: 2,
  },
});
