import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text } from "react-native";

import {
  getSummaryPreview,
  SummaryReaderModal,
} from "@/components/summary-reader-modal";
import {
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  styles as ui,
} from "@/components/ui";
import { useSummaries } from "@/features/study/api";

export default function Summaries() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useSummaries(id);
  const [selected, setSelected] = useState<{
    title: string;
    content: string;
  } | null>(null);
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
      <Stack.Screen options={{ title: "Summary history" }} />
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
            title="No summaries yet"
            message="Generate a summary after a source finishes processing."
          />
        }
        renderItem={({ item, index }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open summary ${index + 1}`}
            onPress={() =>
              setSelected({
                title: `Summary ${index + 1}`,
                content: item.content,
              })
            }
          >
            <Card>
              <Text style={styles.date}>
                {item.createdAt?.toLocaleString() ?? "Summary"}
              </Text>
              <Text numberOfLines={3} selectable style={styles.preview}>
                {getSummaryPreview(item.content)}
              </Text>
              <Text style={styles.link}>Read summary ›</Text>
            </Card>
          </Pressable>
        )}
      />
      <SummaryReaderModal
        visible={selected !== null}
        title={selected?.title ?? "Summary"}
        content={selected?.content ?? ""}
        onClose={() => setSelected(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  date: { color: "#2563EB", fontSize: 12, fontWeight: "800" },
  preview: { color: "#334155", fontSize: 15, lineHeight: 22 },
  link: { color: "#2563EB", fontWeight: "700" },
});
