import { router } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  EmptyState,
  ErrorState,
  LoadingState,
  styles as ui,
} from "@/components/ui";
import { useStudySets } from "@/features/study/api";
import { StudySetCard } from "@/features/study/components/study-set-card";

export default function StudySetsScreen() {
  const query = useStudySets();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  if (query.isPending)
    return <LoadingState label="Loading your study sets..." />;
  if (query.isError)
    return (
      <ErrorState
        message={query.error.message}
        onRetry={() => {
          void query.refetch();
        }}
      />
    );
  const sets = query.items;
  const refresh = async () => {
    setRefreshing(true);
    await query.refetch();
    setRefreshing(false);
  };
  return (
    <View style={ui.screen}>
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        style={ui.screen}
        contentContainerStyle={[
          ui.content,
          sets.length === 0 && { flexGrow: 1, paddingBottom: 100 },
        ]}
        data={sets}
        keyExtractor={(item) => item.id}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage)
            void query.fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void refresh();
            }}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>YOUR LIBRARY</Text>
            <Text style={styles.title}>Study sets</Text>
            <Text style={styles.subtitle}>
              {sets.length
                ? `${sets.length} ${sets.length === 1 ? "set" : "sets"} in your library`
                : "Build your first focused study space"}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="Your library is ready"
            message="Create a study set, add notes or web pages, and Studbady will build your revision tools."
          />
        }
        renderItem={({ item }) => <StudySetCard item={item} />}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Create a new study set"
        onPress={() => router.push("/new-study-set")}
        style={[styles.fab, { bottom: Math.max(insets.bottom, 12) + 64 }]}
      >
        <Text style={styles.fabPlus}>+</Text>
        <Text style={styles.fabText}>New set</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: 4, marginBottom: 4 },
  eyebrow: {
    color: "#2563EB",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  title: { color: "#0F172A", fontSize: 32, fontWeight: "800", marginTop: 4 },
  subtitle: { color: "#64748B", fontSize: 14, lineHeight: 20 },
  fab: {
    position: "absolute",
    right: 20,
    minHeight: 54,
    borderRadius: 28,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#2563EB",
    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
  },
  fabPlus: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "400",
    lineHeight: 27,
  },
  fabText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
});
