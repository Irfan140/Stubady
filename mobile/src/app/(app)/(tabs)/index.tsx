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
            // Clear floating tab bar (68 + bottom margin) plus FAB overlay.
            paddingBottom: Math.max(insets.bottom, 12) + 160,
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
                <Text style={styles.title}>Hey {firstName} 👋</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open settings"
                accessibilityHint="Go to your account settings"
                hitSlop={12}
                onPress={() => {
                  hapticLight();
                  router.push("/(app)/(tabs)/settings");
                }}
                style={({ pressed }) => [
                  styles.avatarButton,
                  pressed && styles.avatarButtonPressed,
                ]}
              >
                <Avatar
                  imageUrl={user?.imageUrl}
                  name={user?.fullName}
                  size={48}
                />
              </Pressable>
            </View>
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
          // Sit above the floating tab bar (68pt + bottom margin) with a gap.
          { bottom: Math.max(insets.bottom, 12) + 80 },
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
  header: { marginBottom: 4 },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  greetingCopy: { flex: 1, justifyContent: "center" },
  avatarButton: { borderRadius: 24 },
  avatarButtonPressed: { opacity: 0.7, transform: [{ scale: 0.94 }] },
  title: {
    color: palette.ink,
    fontSize: type.title.fontSize,
    fontWeight: "800",
    letterSpacing: type.title.letterSpacing,
  },
  fab: {
    position: "absolute",
    right: 20,
    minHeight: 56,
    borderRadius: radius.pill,
    paddingHorizontal: 22,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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
