import { useUser } from "@clerk/expo";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SymbolView } from "expo-symbols";
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
  Avatar,
  EmptyState,
  ErrorState,
  LoadingState,
  styles as ui,
} from "@/components/ui";
import { useStudySets } from "@/features/study/api";
import { StudySetCard } from "@/features/study/components/study-set-card";
import { hapticLight, hapticMedium } from "@/lib/haptics";
import { palette, radius, shadow, type } from "@/theme";

export default function StudySetsScreen() {
  const query = useStudySets();
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  if (query.isPending)
    return <LoadingState label="Loading your study sets..." />;
  if (query.isError)
    return (
      <ErrorState
        message={query.error.message}
        onRetry={() => {
          hapticLight();
          void query.refetch();
        }}
      />
    );
  const sets = query.items;
  const firstName = user?.firstName ?? "there";
  const refresh = async () => {
    setRefreshing(true);
    await query.refetch();
    setRefreshing(false);
  };
  return (
    <View style={ui.screen}>
      <StatusBar style="dark" />
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        style={ui.screen}
        contentContainerStyle={[
          ui.content,
          {
            paddingTop: Math.max(insets.top, 16) + 8,
            paddingBottom: 120,
            flexGrow: sets.length === 0 ? 1 : undefined,
          },
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
            tintColor={palette.primary}
            onRefresh={() => {
              void refresh();
            }}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.greetingRow}>
              <View style={styles.greetingCopy}>
                <View style={styles.pill}>
                  <Text style={styles.pillText}>YOUR LIBRARY</Text>
                </View>
                <Text style={styles.title}>Hey {firstName} 👋</Text>
                <Text style={styles.subtitle}>
                  {sets.length
                    ? `${sets.length} ${sets.length === 1 ? "set" : "sets"} in your library`
                    : "Build your first focused study space"}
                </Text>
              </View>
              <Avatar
                imageUrl={user?.imageUrl}
                name={user?.fullName}
                size={48}
              />
            </View>
            {sets.length > 0 ? (
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <SymbolView
                    name={{ ios: "square.stack.3d.up", android: "style" }}
                    tintColor={palette.primary}
                    size={20}
                  />
                  <Text style={styles.statValue}>{sets.length}</Text>
                  <Text style={styles.statLabel}>Sets</Text>
                </View>
                <View style={styles.stat}>
                  <SymbolView
                    name={{ ios: "sparkles", android: "auto_awesome" }}
                    tintColor={palette.accent}
                    size={20}
                  />
                  <Text style={styles.statValue}>AI</Text>
                  <Text style={styles.statLabel}>Summaries</Text>
                </View>
                <View style={styles.stat}>
                  <SymbolView
                    name={{
                      ios: "bubble.left.and.bubble.right",
                      android: "chat_bubble",
                    }}
                    tintColor={palette.success}
                    size={20}
                  />
                  <Text style={styles.statValue}>Chat</Text>
                  <Text style={styles.statLabel}>Tutor</Text>
                </View>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon={
              <SymbolView
                name={{ ios: "books.vertical", android: "library_books" }}
                tintColor={palette.primary}
                size={32}
              />
            }
            title="Your library is ready"
            message="Create a study set, add notes or web pages, and Studbady will build your revision tools."
            action={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Create your first study set"
                onPress={() => {
                  hapticMedium();
                  router.push("/new-study-set");
                }}
                style={({ pressed }) => [
                  styles.emptyCta,
                  pressed && styles.emptyCtaPressed,
                ]}
              >
                <Text style={styles.emptyCtaText}>Create your first set</Text>
              </Pressable>
            }
          />
        }
        renderItem={({ item }) => <StudySetCard item={item} />}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Create a new study set"
        onPress={() => {
          hapticMedium();
          router.push("/new-study-set");
        }}
        style={({ pressed }) => [
          styles.fab,
          { bottom: Math.max(insets.bottom, 12) + 64 },
          pressed && styles.fabPressed,
        ]}
      >
        <SymbolView
          name={{ ios: "plus", android: "add" }}
          tintColor="#FFFFFF"
          size={22}
        />
        <Text style={styles.fabText}>New set</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: 14, marginBottom: 6 },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  greetingCopy: { flex: 1, gap: 6 },
  pill: {
    alignSelf: "flex-start",
    backgroundColor: palette.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pillText: {
    color: palette.primaryDeep,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  title: {
    color: palette.ink,
    fontSize: type.title.fontSize,
    fontWeight: "800",
    letterSpacing: type.title.letterSpacing,
  },
  subtitle: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: radius.lg,
    padding: 12,
    ...shadow.card,
  },
  stat: { flex: 1, alignItems: "center", gap: 2 },
  statValue: { color: palette.ink, fontSize: 16, fontWeight: "800" },
  statLabel: { color: palette.faint, fontSize: 11, fontWeight: "700" },
  fab: {
    position: "absolute",
    right: 20,
    minHeight: 56,
    borderRadius: 28,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: palette.primary,
    ...shadow.raised,
  },
  fabPressed: {
    backgroundColor: palette.primaryDeep,
    transform: [{ scale: 0.96 }],
  },
  fabText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  emptyCta: {
    backgroundColor: palette.primary,
    borderRadius: radius.pill,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  emptyCtaPressed: { backgroundColor: palette.primaryDeep },
  emptyCtaText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
});
