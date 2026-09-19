import { useUser } from "@clerk/expo";
import { Link, router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useMemo } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Avatar,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  ProgressLine,
  Screen,
  useUiStyles,
} from "@/components/ui";
import {
  useConversations,
  useDecks,
  useSources,
  useStudySets,
  useSummaries,
} from "@/features/study/api";
import { hapticMedium } from "@/lib/haptics";
import { useTheme } from "@/stores/theme-store";
import { type, radius, type Palette } from "@/theme";

export default function StudyHome() {
  const { palette } = useTheme();
  const ui = useUiStyles();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const setsQuery = useStudySets();

  if (setsQuery.isPending) return <LoadingState label="Lighting your desk…" />;
  if (setsQuery.isError)
    return (
      <ErrorState
        message={setsQuery.error.message}
        onRetry={() => {
          void setsQuery.refetch();
        }}
      />
    );

  const sets = [...setsQuery.items].sort(
    (a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0),
  );
  const current = sets[0];
  const firstName = user?.firstName ?? "there";

  return (
    <Screen>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          ui.content,
          {
            paddingTop: Math.max(insets.top, 16) + 4,
            paddingBottom: 24,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={false}
            tintColor={palette.primary}
            onRefresh={() => {
              void setsQuery.refetch();
            }}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.greeting}>
            <Text style={styles.title}>Good to see you, {firstName}</Text>
            <Text style={styles.subtitle}>
              {current
                ? "Your desk is set. Pick up where you left off."
                : "Let's build your first revision space."}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open settings"
            hitSlop={8}
            onPress={() => router.push("/(app)/settings")}
            style={({ pressed }) => [
              styles.avatarButton,
              pressed && styles.pressed,
            ]}
          >
            <Avatar imageUrl={user?.imageUrl} name={user?.fullName} size={44} />
          </Pressable>
        </View>

        {current ? (
          <ContinuePanel setId={current.id} title={current.title} />
        ) : (
          <EmptyState
            icon={
              <SymbolView
                name={{ ios: "book", android: "auto_stories" }}
                tintColor={palette.primary}
                size={30}
              />
            }
            title="Your desk is empty"
            message="Create a study set for a subject, add your PDFs or notes, and Stubady turns them into chats, summaries, and flashcards."
            action={
              <Button
                title="Create your first set"
                onPress={() => {
                  hapticMedium();
                  router.push("/(app)/new-study-set");
                }}
              />
            }
          />
        )}

        <Card>
          <Text style={styles.cardTitle}>Capture material</Text>
          <Text style={styles.cardBody}>
            Drop in the latest reading and it processes in the background.
          </Text>
          <View style={styles.captureRow}>
            <View style={styles.captureFlex}>
              <Button
                title="New set"
                variant="secondary"
                onPress={() => router.push("/(app)/new-study-set")}
              />
            </View>
            {current ? (
              <View style={styles.captureFlex}>
                <Button
                  title={`Add to ${truncate(current.title)}`}
                  onPress={() =>
                    router.push({
                      pathname: "/(app)/study-set/[id]",
                      params: { id: current.id, addSource: "1" },
                    })
                  }
                />
              </View>
            ) : null}
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}

function truncate(title: string, max = 18) {
  return title.length > max ? `${title.slice(0, max - 1)}…` : title;
}

/**
 * The lit pool: current set, its readiness, and the single Continue action.
 * Recency ranks; readiness rides along as the secondary line.
 */
function ContinuePanel({ setId, title }: { setId: string; title: string }) {
  const { palette } = useTheme();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const sources = useSources(setId);
  const conversations = useConversations(setId);
  const decks = useDecks(setId);
  const summaries = useSummaries(setId);

  const total = sources.items.length;
  const ready = sources.items.filter((s) => s.status === "ready").length;
  const stuck = sources.items.filter((s) => s.status === "failed").length;
  const latestChat = conversations.items[0];
  const latestDeck = decks.items[0];
  const latestSummary = summaries.items[0];

  const resumeTarget = latestChat
    ? {
        pathname: "/(app)/chat/[id]" as const,
        params: { id: latestChat.id, studySetId: setId },
        label: "Resume chat",
      }
    : latestDeck
      ? {
          pathname: "/(app)/deck/[id]" as const,
          params: { id: latestDeck.id, studySetId: setId },
          label: "Review deck",
        }
      : null;

  return (
    <View style={styles.pool}>
      <View style={styles.poolHeader}>
        <Text style={styles.poolTitle} numberOfLines={2}>
          {title}
        </Text>
        <Link
          href={{ pathname: "/(app)/study-set/[id]", params: { id: setId } }}
          asChild
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open ${title}`}
          >
            <Text style={styles.poolLink}>Open set ›</Text>
          </Pressable>
        </Link>
      </View>

      {total > 0 ? (
        <ProgressLine
          ready={ready}
          total={total}
          caption={
            stuck > 0
              ? `${ready} of ${total} ready · ${stuck} need${stuck === 1 ? "s" : ""} attention`
              : ready === total
                ? `${total} ${total === 1 ? "source" : "sources"} ready — study tools are live`
                : `${ready} of ${total} ready — processing the rest`
          }
        />
      ) : (
        <Text style={styles.poolNote}>
          No sources yet — add one to light up study tools.
        </Text>
      )}

      <Button
        title="Continue studying"
        onPress={() =>
          router.push({
            pathname: "/(app)/study-set/[id]",
            params: { id: setId },
          })
        }
      />

      {resumeTarget || latestSummary ? (
        <View style={styles.resumeRow}>
          {resumeTarget ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={resumeTarget.label}
              onPress={() => router.push(resumeTarget)}
              style={({ pressed }) => [
                styles.resumeChip,
                pressed && styles.pressed,
              ]}
            >
              <SymbolView
                name={
                  latestChat
                    ? { ios: "bubble.left", android: "chat_bubble" }
                    : { ios: "square.stack.3d.up", android: "style" }
                }
                tintColor={palette.primary}
                size={16}
              />
              <Text numberOfLines={1} style={styles.resumeText}>
                {resumeTarget.label}
              </Text>
            </Pressable>
          ) : null}
          {latestSummary ? (
            <View style={styles.resumeStatus}>
              <View
                accessibilityElementsHidden
                importantForAccessibility="no"
                style={[styles.statusDot, { backgroundColor: palette.success }]}
              />
              <Text numberOfLines={1} style={styles.resumeStatusText}>
                Summary ready
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    header: { flexDirection: "row", alignItems: "center", gap: 12 },
    greeting: { flex: 1, gap: 4 },
    title: {
      color: palette.ink,
      fontSize: type.title.fontSize,
      fontWeight: "800",
      letterSpacing: type.title.letterSpacing,
    },
    subtitle: { color: palette.muted, fontSize: 15, lineHeight: 21 },
    avatarButton: { borderRadius: 22 },
    pressed: { opacity: 0.7, transform: [{ scale: 0.96 }] },
    pool: {
      gap: 12,
      backgroundColor: palette.surface,
      borderRadius: radius.xl,
      padding: 18,
      borderWidth: 1,
      borderColor: palette.line,
      borderTopWidth: 3,
      borderTopColor: palette.primary,
    },
    poolHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12,
    },
    poolTitle: {
      flex: 1,
      color: palette.ink,
      fontSize: type.h2.fontSize,
      fontWeight: "800",
    },
    poolLink: { color: palette.primary, fontWeight: "700", fontSize: 14 },
    poolNote: { color: palette.muted, fontSize: 14, lineHeight: 20 },
    resumeRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 8,
    },
    resumeChip: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      minHeight: 44,
      paddingHorizontal: 14,
      borderRadius: radius.pill,
      backgroundColor: palette.primarySoft,
      flexShrink: 1,
    },
    resumeText: {
      color: palette.primary,
      fontSize: 14,
      fontWeight: "800",
      flexShrink: 1,
    },
    resumeStatus: {
      minHeight: 44,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingHorizontal: 4,
      flexShrink: 1,
    },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    resumeStatusText: {
      color: palette.muted,
      fontSize: 13,
      fontWeight: "700",
      lineHeight: 18,
      flexShrink: 1,
    },
    cardTitle: { color: palette.ink, fontSize: 18, fontWeight: "800" },
    cardBody: { color: palette.muted, fontSize: 14, lineHeight: 20 },
    captureRow: { flexDirection: "row", gap: 10 },
    captureFlex: { flex: 1 },
  });
