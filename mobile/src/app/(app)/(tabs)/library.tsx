import { useUser } from "@clerk/expo";
import { Link, router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useMemo } from "react";
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
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  ProgressLine,
  Screen,
  useUiStyles,
} from "@/components/ui";
import { useSources, useStudySets } from "@/features/study/api";
import type { StudySet } from "@/features/study/types";
import { useTheme } from "@/stores/theme-store";
import { radius, type, type Palette } from "@/theme";

export default function Library() {
  const { palette } = useTheme();
  const ui = useUiStyles();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const query = useStudySets();

  if (query.isPending) return <LoadingState label="Opening your library…" />;
  if (query.isError)
    return (
      <ErrorState
        message={query.error.message}
        onRetry={() => {
          void query.refetch();
        }}
      />
    );

  const sets = [...query.items].sort(
    (a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0),
  );

  return (
    <Screen>
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          ui.content,
          {
            paddingTop: Math.max(insets.top, 16) + 4,
            paddingBottom: 24,
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
            refreshing={false}
            tintColor={palette.primary}
            onRefresh={() => {
              void query.refetch();
            }}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.heading}>
              <Text style={styles.title}>Library</Text>
              <Text style={styles.subtitle}>
                {sets.length === 0
                  ? "Every subject gets its own revision space."
                  : `${sets.length} ${sets.length === 1 ? "set" : "sets"} — readiness at a glance.`}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open settings"
              hitSlop={8}
              onPress={() => router.push("/(app)/settings")}
              style={({ pressed }) => [pressed && styles.pressed]}
            >
              <Avatar
                imageUrl={user?.imageUrl}
                name={user?.fullName}
                size={44}
              />
            </Pressable>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon={
              <SymbolView
                name={{ ios: "books.vertical", android: "library_books" }}
                tintColor={palette.primary}
                size={30}
              />
            }
            title="No study sets yet"
            message="Create one per subject or exam. Sources, chats, summaries, and decks all live inside it."
            action={
              <Button
                title="Create a study set"
                onPress={() => router.push("/(app)/new-study-set")}
              />
            }
          />
        }
        renderItem={({ item }) => <LibraryRow item={item} />}
      />
    </Screen>
  );
}

/** One set with its live readiness — the row that tells you where to go. */
function LibraryRow({ item }: { item: StudySet }) {
  const { palette } = useTheme();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const sources = useSources(item.id);
  const total = sources.items.length;
  const ready = sources.items.filter((s) => s.status === "ready").length;
  const stuck = sources.items.filter((s) => s.status === "failed").length;

  return (
    <Link
      href={{ pathname: "/(app)/study-set/[id]", params: { id: item.id } }}
      asChild
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.title}`}
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        <View style={styles.row}>
          <View style={styles.rowMain}>
            <Text numberOfLines={2} style={styles.rowTitle}>
              {item.title}
            </Text>
            {sources.isPending ? (
              <Text style={styles.rowMeta}>Checking sources…</Text>
            ) : total === 0 ? (
              <Text style={styles.rowMeta}>Empty — add your first source</Text>
            ) : (
              <ProgressLine
                ready={ready}
                total={total}
                caption={
                  stuck > 0
                    ? `${ready}/${total} ready · ${stuck} failed`
                    : ready === total
                      ? `${total} ready`
                      : `${ready}/${total} ready`
                }
              />
            )}
          </View>
          <SymbolView
            name={{ ios: "chevron.right", android: "chevron_right" }}
            tintColor={palette.faint}
            size={20}
          />
        </View>
      </Pressable>
    </Link>
  );
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    header: { flexDirection: "row", alignItems: "center", gap: 12 },
    heading: { flex: 1, gap: 4 },
    title: {
      color: palette.ink,
      fontSize: type.title.fontSize,
      fontWeight: "800",
      letterSpacing: type.title.letterSpacing,
    },
    subtitle: { color: palette.muted, fontSize: 15, lineHeight: 21 },
    pressed: { opacity: 0.7 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: palette.surface,
      borderRadius: radius.lg,
      padding: 16,
      borderWidth: 1,
      borderColor: palette.line,
    },
    rowMain: { flex: 1, gap: 8 },
    rowTitle: {
      color: palette.ink,
      fontSize: 17,
      lineHeight: 23,
      fontWeight: "800",
    },
    rowMeta: { color: palette.muted, fontSize: 13, lineHeight: 18 },
  });
