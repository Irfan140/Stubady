import { Link, Stack, useLocalSearchParams } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text } from "react-native";

import {
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  styles as ui,
} from "@/components/ui";
import { useDecks } from "@/features/study/api";

export default function Decks() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useDecks(id);
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
  return (
    <>
      <Stack.Screen options={{ title: "Flashcard decks" }} />
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
        ListEmptyComponent={
          <EmptyState
            title="No decks yet"
            message="Generate flashcards after a source finishes processing."
          />
        }
        renderItem={({ item }) => (
          <Link
            href={{
              pathname: "/deck/[id]",
              params: { id: item.id, studySetId: id },
            }}
            asChild
          >
            <Pressable>
              <Card>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={ui.muted}>
                  {item.cardCount} cards ·{" "}
                  {item.createdAt?.toLocaleString() ?? "Recently created"}
                </Text>
              </Card>
            </Pressable>
          </Link>
        )}
      />
    </>
  );
}
const styles = StyleSheet.create({
  title: { color: "#0F172A", fontSize: 18, fontWeight: "700" },
});
