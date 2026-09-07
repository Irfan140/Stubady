import { Stack, router, useLocalSearchParams } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
import { useDeleteSummary, useSummaries } from "@/features/study/api";
import type { Summary } from "@/features/study/types";

export default function Summaries() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const query = useSummaries(id);
  const [selected, setSelected] = useState<{
    id: string;
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
                Summary history
              </Text>
              <View style={styles.navSpacer} />
            </View>
            <Card style={styles.hero}>
              <Text style={styles.eyebrow}>SUMMARIES</Text>
              <Text style={styles.heroTitle}>Summary history</Text>
              <Text style={styles.heroSubtitle}>
                {query.items.length
                  ? `${query.items.length} saved ${query.items.length === 1 ? "summary" : "summaries"} — tap one to read it.`
                  : "Generated summaries will appear here."}
              </Text>
            </Card>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="No summaries yet"
            message="Generate a summary after a source finishes processing."
          />
        }
        renderItem={({ item, index }) => (
          <SummaryRow
            item={item}
            index={index}
            studySetId={id}
            onOpen={() =>
              setSelected({
                id: item.id,
                title: `Summary ${index + 1}`,
                content: item.content,
              })
            }
            onDeleted={(deletedId) => {
              if (selected?.id === deletedId) setSelected(null);
            }}
          />
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

function SummaryRow({
  item,
  index,
  studySetId,
  onOpen,
  onDeleted,
}: {
  item: Summary;
  index: number;
  studySetId: string;
  onOpen: () => void;
  onDeleted: (id: string) => void;
}) {
  const remove = useDeleteSummary(studySetId);
  const confirmDelete = () =>
    Alert.alert(
      "Delete summary?",
      "This removes the generated summary. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            remove.mutate(item.id, {
              onSuccess: () => onDeleted(item.id),
              onError: (error) =>
                Alert.alert("Unable to delete summary", error.message),
            }),
        },
      ],
    );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open summary ${index + 1}`}
      onPress={onOpen}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <Card style={styles.item}>
        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <SymbolView
              name={{ ios: "doc.text", android: "description" }}
              tintColor="#4F46E5"
              size={22}
            />
          </View>
          <View style={styles.copy}>
            <View style={styles.metaRow}>
              <Text style={styles.date}>
                {item.createdAt?.toLocaleString() ?? `Summary ${index + 1}`}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Delete summary ${index + 1}`}
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
            <Text numberOfLines={3} selectable style={styles.preview}>
              {getSummaryPreview(item.content)}
            </Text>
            <Text style={styles.link}>Read summary ›</Text>
          </View>
          <SymbolView
            name={{ ios: "chevron.right", android: "chevron_right" }}
            tintColor="#94A3B8"
            size={20}
          />
        </View>
      </Card>
    </Pressable>
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
  preview: { color: "#334155", fontSize: 15, lineHeight: 22 },
  link: { color: "#4F46E5", fontWeight: "700" },
  pressed: { opacity: 0.85 },
});
