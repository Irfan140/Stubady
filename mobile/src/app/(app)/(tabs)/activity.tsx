import { router } from "expo-router";
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
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  useUiStyles,
} from "@/components/ui";
import {
  useSetsActivity,
  useStudySets,
  type ActivityItem,
} from "@/features/study/api";
import { useTheme } from "@/stores/theme-store";
import { radius, type, type Palette } from "@/theme";

const KIND_ICON = {
  chat: { ios: "bubble.left", android: "chat_bubble" },
  deck: { ios: "square.stack.3d.up", android: "style" },
  summary: { ios: "doc.text", android: "description" },
} as const;

const KIND_LABEL = { chat: "Chat", deck: "Deck", summary: "Summary" } as const;

function formatDate(date: Date | null) {
  if (!date) return "";
  try {
    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

/** One global feed across sets — every row resumes directly. */
export default function Activity() {
  const { palette } = useTheme();
  const ui = useUiStyles();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const insets = useSafeAreaInsets();
  const setsQuery = useStudySets();
  const feed = useSetsActivity(
    useMemo(
      () =>
        (setsQuery.data?.pages.flatMap((p) => p.data) ?? []).map((s) => ({
          id: s.id,
          title: s.title,
        })),
      [setsQuery.data],
    ),
  );

  if (setsQuery.isPending || (setsQuery.data && feed.isPending))
    return <LoadingState label="Gathering recent activity…" />;
  if (setsQuery.isError)
    return (
      <ErrorState
        message={setsQuery.error.message}
        onRetry={() => {
          void setsQuery.refetch();
        }}
      />
    );
  if (feed.isError)
    return (
      <ErrorState
        message={feed.error?.message ?? "Couldn't load activity."}
        onRetry={() => feed.refetch()}
      />
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
            flexGrow: feed.items.length === 0 ? 1 : undefined,
          },
        ]}
        data={feed.items}
        keyExtractor={(item) => item.key}
        refreshControl={
          <RefreshControl
            refreshing={false}
            tintColor={palette.primary}
            onRefresh={() => {
              void setsQuery.refetch();
              feed.refetch();
            }}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Activity</Text>
            <Text style={styles.subtitle}>
              Chats, decks, and summaries across every set — newest first.
            </Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon={
              <SymbolView
                name={{ ios: "clock", android: "history" }}
                tintColor={palette.primary}
                size={30}
              />
            }
            title="Nothing here yet"
            message="Ask a question, generate a summary, or build a deck — it will appear here so you can jump straight back in."
          />
        }
        renderItem={({ item }) => <ActivityRow item={item} />}
      />
    </Screen>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const { palette } = useTheme();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const open = () => {
    if (item.kind === "chat")
      router.push({
        pathname: "/(app)/chat/[id]",
        params: { id: item.targetId, studySetId: item.setId },
      });
    else if (item.kind === "deck")
      router.push({
        pathname: "/(app)/deck/[id]",
        params: { id: item.targetId, studySetId: item.setId },
      });
    else
      router.push({
        pathname: "/(app)/study-set/[id]",
        params: { id: item.setId, openSummary: item.targetId },
      });
  };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${item.title} in ${item.setTitle}`}
      onPress={open}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <SymbolView
            name={KIND_ICON[item.kind]}
            tintColor={palette.primary}
            size={20}
          />
        </View>
        <View style={styles.copy}>
          <Text style={styles.meta}>
            {KIND_LABEL[item.kind]} · {item.setTitle}
            {formatDate(item.date) ? ` · ${formatDate(item.date)}` : ""}
          </Text>
          <Text style={styles.rowTitle} numberOfLines={2}>
            {item.detail || item.title}
          </Text>
        </View>
        <SymbolView
          name={{ ios: "chevron.right", android: "chevron_right" }}
          tintColor={palette.faint}
          size={20}
        />
      </View>
    </Pressable>
  );
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    header: { gap: 4 },
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
      padding: 14,
      borderWidth: 1,
      borderColor: palette.line,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      backgroundColor: palette.pool,
      alignItems: "center",
      justifyContent: "center",
    },
    copy: { flex: 1, gap: 3 },
    meta: { color: palette.primary, fontSize: 12, fontWeight: "800" },
    rowTitle: {
      color: palette.ink,
      fontSize: 15,
      lineHeight: 21,
      fontWeight: "600",
    },
  });
