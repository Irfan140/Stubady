import { router, useLocalSearchParams } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  getSummaryPreview,
  SummaryReaderModal,
} from "@/components/summary-reader-modal";
import {
  Button,
  ProgressLine,
  Screen,
  Segmented,
  Sheet,
  TextField,
  TopBar,
  ErrorState,
  EmptyState,
  LoadingState,
  useUiStyles,
} from "@/components/ui";
import {
  useConversation,
  useConversations,
  useCreateSource,
  useDecks,
  useDeleteConversation,
  useDeleteSource,
  useDeleteStudySet,
  useDeleteSummary,
  useGenerateFlashcards,
  useGenerateSummary,
  useRetrySource,
  useSources,
  useStudySet,
  useSummaries,
  useUpdateStudySet,
} from "@/features/study/api";
import { IntakeSheet } from "@/features/study/components/intake-sheet";
import type {
  Conversation,
  Deck,
  Source,
  Summary,
} from "@/features/study/types";
import { hapticMedium } from "@/lib/haptics";
import { useTheme } from "@/stores/theme-store";
import { radius, shadow, type Palette } from "@/theme";

type Segment = "sources" | "chats" | "decks" | "summaries";

function formatDateTime(date?: Date | null) {
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

export default function StudySetHub() {
  const { id, addSource, openSummary } = useLocalSearchParams<{
    id: string;
    addSource?: string;
    openSummary?: string;
  }>();
  const { palette } = useTheme();
  const ui = useUiStyles();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const insets = useSafeAreaInsets();

  const [segment, setSegment] = useState<Segment>("sources");
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [reader, setReader] = useState<{
    title: string;
    content: string;
  } | null>(null);
  const [cardCount, setCardCount] = useState(12);

  const set = useStudySet(id);
  const sources = useSources(id);
  const summaries = useSummaries(id);
  const createSource = useCreateSource(id);
  const askAi = useConversation(id);
  const generateSummary = useGenerateSummary(id);
  const updateSet = useUpdateStudySet(id);
  const deleteSet = useDeleteStudySet();
  const chatCount = useConversations(id).items.length;
  const deckCount = useDecks(id).items.length;

  useEffect(() => {
    if (addSource === "1") {
      setIntakeOpen(true);
      router.setParams({ addSource: "0" });
    }
    // One-shot open; the param is flipped so returning here won't reopen.
  }, [addSource]);

  const summaryOpened = useRef<string | null>(null);
  useEffect(() => {
    if (typeof openSummary === "string" && openSummary.length > 0) {
      if (summaryOpened.current === openSummary) return;
      const target = summaries.items.find((s) => s.id === openSummary);
      if (target) {
        summaryOpened.current = openSummary;
        setSegment("summaries");
        setReader({
          title: `Summary · ${formatDateTime(target.createdAt)}`,
          content: target.content,
        });
        router.setParams({ openSummary: "0" });
      }
    }
  }, [openSummary, summaries.items]);

  if (set.isPending) return <LoadingState label="Opening study set…" />;
  if (set.isError)
    return (
      <ErrorState
        message={set.error.message}
        onRetry={() => {
          void set.refetch();
        }}
      />
    );

  const total = sources.items.length;
  const readyCount = sources.items.filter((s) => s.status === "ready").length;
  const failedCount = sources.items.filter((s) => s.status === "failed").length;
  const canStudy = readyCount > 0;

  const startChat = () => {
    askAi.mutate(undefined, {
      onSuccess: (conversation) =>
        router.push({
          pathname: "/(app)/chat/[id]",
          params: { id: conversation.id, studySetId: id },
        }),
      onError: (error) => Alert.alert("Unable to start chat", error.message),
    });
  };

  const startSummary = () => {
    setSegment("summaries");
    generateSummary.mutate(undefined, {
      onSuccess: (result) =>
        setReader({
          title: `Summary · ${formatDateTime(new Date())}`,
          content: result.content,
        }),
      onError: (error) =>
        Alert.alert("Unable to generate summary", error.message),
    });
  };

  const startPractice = () => {
    setSegment("decks");
  };

  const confirmDelete = () =>
    Alert.alert(
      "Delete study set?",
      "This removes the study set, its sources, and everything generated from them.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            deleteSet.mutate(id, {
              onSuccess: () => router.replace("/(app)/(tabs)"),
              onError: (error) =>
                Alert.alert("Unable to delete study set", error.message),
            }),
        },
      ],
    );

  return (
    <Screen>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          ui.content,
          {
            paddingTop: Math.max(insets.top, 12) + 4,
            paddingBottom: 32,
          },
        ]}
        stickyHeaderIndices={[1]}
      >
        <View style={styles.heading}>
          <TopBar
            title={set.data.title}
            action={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Study set options"
                hitSlop={8}
                onPress={() => setMenuOpen(true)}
                style={({ pressed }) => [
                  styles.menuButton,
                  pressed && styles.pressed,
                ]}
              >
                <SymbolView
                  name={{ ios: "ellipsis", android: "more_horiz" }}
                  tintColor={palette.ink}
                  size={22}
                />
              </Pressable>
            }
          />
          {total > 0 ? (
            <ProgressLine
              ready={readyCount}
              total={total}
              caption={
                failedCount > 0
                  ? `${readyCount} of ${total} ready · ${failedCount} failed — study tools use ready sources only`
                  : readyCount === total
                    ? `${total} ${total === 1 ? "source" : "sources"} ready — study tools are live`
                    : `${readyCount} of ${total} ready — study tools use ready sources only`
              }
            />
          ) : (
            <Text style={styles.hint}>
              Add a source below — study tools wake up once one is ready.
            </Text>
          )}
        </View>

        <View style={styles.actionBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ask AI about this set"
            accessibilityState={{ disabled: !canStudy || askAi.isPending }}
            disabled={!canStudy || askAi.isPending}
            onPress={startChat}
            style={({ pressed }) => [
              styles.actionPrimary,
              (!canStudy || askAi.isPending) && styles.actionDisabled,
              pressed && canStudy && styles.pressed,
            ]}
          >
            <SymbolView
              name={{ android: "auto_awesome", ios: "sparkles" }}
              tintColor={palette.primaryInk}
              size={18}
            />
            <Text style={styles.actionPrimaryText}>
              {askAi.isPending ? "Opening…" : "Ask"}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Generate a summary"
            disabled={generateSummary.isPending}
            onPress={startSummary}
            style={({ pressed }) => [
              styles.actionGhost,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.actionGhostText}>
              {generateSummary.isPending ? "Writing…" : "Summarize"}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Practice with flashcards"
            onPress={startPractice}
            style={({ pressed }) => [
              styles.actionGhost,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.actionGhostText}>Practice</Text>
          </Pressable>
        </View>

        <View style={styles.body}>
          <Segmented<Segment>
            ariaLabel="Study set sections"
            value={segment}
            onChange={setSegment}
            options={[
              {
                value: "sources",
                label: `Sources${total > 0 ? ` ${total}` : ""}`,
              },
              {
                value: "chats",
                label: `Chats${chatCount > 0 ? ` ${chatCount}` : ""}`,
              },
              {
                value: "decks",
                label: `Decks${deckCount > 0 ? ` ${deckCount}` : ""}`,
              },
              { value: "summaries", label: "Summaries" },
            ]}
          />

          {segment === "sources" ? (
            <SourcesSegment studySetId={id} onAdd={() => setIntakeOpen(true)} />
          ) : segment === "chats" ? (
            <ChatsSegment
              studySetId={id}
              onNew={startChat}
              creating={askAi.isPending}
            />
          ) : segment === "decks" ? (
            <DecksSegment
              studySetId={id}
              count={cardCount}
              onCountChange={setCardCount}
            />
          ) : (
            <SummariesSegment
              studySetId={id}
              generating={generateSummary.isPending}
              onGenerate={startSummary}
              onOpen={(title, content) => setReader({ title, content })}
            />
          )}
        </View>
      </ScrollView>

      <IntakeSheet
        visible={intakeOpen}
        onClose={() => setIntakeOpen(false)}
        studySetId={id}
        mutation={createSource}
      />

      <Sheet
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        title="Study set options"
      >
        <Button
          title="Rename set"
          variant="secondary"
          onPress={() => {
            setMenuOpen(false);
            setRenameOpen(true);
          }}
        />
        <Button
          title="Delete set"
          variant="danger"
          loading={deleteSet.isPending}
          onPress={() => {
            setMenuOpen(false);
            confirmDelete();
          }}
        />
      </Sheet>

      <RenameSheet
        visible={renameOpen}
        initialTitle={set.data.title}
        saving={updateSet.isPending}
        error={updateSet.isError ? updateSet.error.message : null}
        onClose={() => setRenameOpen(false)}
        onSave={async (title) => {
          try {
            await updateSet.mutateAsync(title);
            setRenameOpen(false);
          } catch {
            /* error renders in the sheet */
          }
        }}
      />

      {reader ? (
        <SummaryReaderModal
          visible
          title={reader.title}
          content={reader.content}
          onClose={() => setReader(null)}
        />
      ) : null}
    </Screen>
  );
}

function RenameSheet({
  visible,
  initialTitle,
  saving,
  error,
  onClose,
  onSave,
}: {
  visible: boolean;
  initialTitle: string;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (title: string) => Promise<void>;
}) {
  const [title, setTitle] = useState(initialTitle);
  useEffect(() => {
    if (visible) setTitle(initialTitle);
  }, [visible, initialTitle]);
  const styles = useUiStyles();
  const trimmed = title.trim();
  return (
    <Sheet visible={visible} onClose={onClose} title="Rename set">
      <TextField
        label="Title"
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. Biology — Cell structure"
        maxLength={200}
        editable={!saving}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button
        title="Save changes"
        loading={saving}
        disabled={trimmed.length === 0}
        onPress={() => {
          void onSave(trimmed);
        }}
      />
    </Sheet>
  );
}

/* ------------------------------- segments ------------------------------- */

function SourcesSegment({
  studySetId,
  onAdd,
}: {
  studySetId: string;
  onAdd: () => void;
}) {
  const sources = useSources(studySetId);
  const { palette } = useTheme();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  if (sources.isPending) return <LoadingState label="Loading sources…" />;
  if (sources.isError)
    return (
      <ErrorState
        message={sources.error.message}
        onRetry={() => {
          void sources.refetch();
        }}
      />
    );
  return (
    <View style={styles.segment}>
      <Button title="+ Add source" variant="secondary" onPress={onAdd} />
      {sources.items.length === 0 ? (
        <EmptyState
          title="No sources yet"
          message="Add a PDF, a note, or a web page. Processing runs in the background — you'll see each source turn ready."
        />
      ) : (
        sources.items.map((item) => (
          <SourceRow key={item.id} item={item} studySetId={studySetId} />
        ))
      )}
    </View>
  );
}

function SourceRow({ item, studySetId }: { item: Source; studySetId: string }) {
  const retry = useRetrySource(studySetId);
  const remove = useDeleteSource(studySetId);
  const { palette } = useTheme();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const active = item.status === "pending" || item.status === "processing";
  const statusColor =
    item.status === "ready"
      ? palette.success
      : item.status === "failed"
        ? palette.danger
        : palette.warning;
  const statusLabel =
    item.status === "pending"
      ? "Queued"
      : item.status === "processing"
        ? "Processing"
        : item.status === "ready"
          ? "Ready"
          : "Failed";
  return (
    <View style={styles.row}>
      <View style={styles.rowTop}>
        <View style={styles.rowMain}>
          <View style={styles.rowHeader}>
            <Text style={styles.rowType}>{item.type.toUpperCase()}</Text>
            <View style={styles.statusWrap}>
              {active ? null : (
                <View
                  style={[styles.statusDot, { backgroundColor: statusColor }]}
                />
              )}
              <Text style={styles.statusText}>{statusLabel}</Text>
            </View>
          </View>
          <Text selectable style={styles.rowBody} numberOfLines={3}>
            {item.type === "web" ? item.url : item.content}
          </Text>
          {active ? (
            <Text style={styles.rowMeta}>
              {item.status === "pending"
                ? "Waiting to be processed…"
                : "Extracting content and preparing study tools…"}
            </Text>
          ) : null}
          {item.error_message ? (
            <Text style={styles.rowError} selectable>
              {item.error_message}
            </Text>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Delete source"
          hitSlop={8}
          disabled={remove.isPending}
          onPress={() =>
            Alert.alert(
              "Delete source?",
              "This removes the source and its processed study material.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () =>
                    remove.mutate(item.id, {
                      onError: (error) =>
                        Alert.alert("Unable to delete source", error.message),
                    }),
                },
              ],
            )
          }
          style={({ pressed }) => [
            styles.trashButton,
            pressed && styles.pressed,
            remove.isPending && styles.actionDisabled,
          ]}
        >
          <SymbolView
            name={{ ios: "trash", android: "delete" }}
            tintColor={palette.danger}
            size={20}
          />
        </Pressable>
      </View>
      {item.status === "failed" ||
      (item.status === "pending" && item.type === "pdf") ? (
        <Button
          title={retry.isPending ? "Retrying…" : "Retry"}
          variant="secondary"
          disabled={retry.isPending}
          onPress={() =>
            retry.mutate(item.id, {
              onError: (error) =>
                Alert.alert("Unable to retry source", error.message),
            })
          }
        />
      ) : null}
    </View>
  );
}

function ChatsSegment({
  studySetId,
  onNew,
  creating,
}: {
  studySetId: string;
  onNew: () => void;
  creating: boolean;
}) {
  const query = useConversations(studySetId);
  const { palette } = useTheme();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  if (query.isPending) return <LoadingState label="Loading chats…" />;
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
    <View style={styles.segment}>
      <Button
        title={creating ? "Opening…" : "+ New chat"}
        variant="secondary"
        disabled={creating}
        onPress={onNew}
      />
      {query.items.length === 0 ? (
        <EmptyState
          title="No chats yet"
          message="Ask anything about this set's ready material — answers cite the source they came from."
        />
      ) : (
        query.items.map((item, index) => (
          <ChatRow
            key={item.id}
            item={item}
            index={index}
            studySetId={studySetId}
          />
        ))
      )}
    </View>
  );
}

function ChatRow({
  item,
  index,
  studySetId,
}: {
  item: Conversation;
  index: number;
  studySetId: string;
}) {
  const remove = useDeleteConversation(studySetId);
  const { palette } = useTheme();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Resume conversation ${index + 1}`}
      onPress={() =>
        router.push({
          pathname: "/(app)/chat/[id]",
          params: { id: item.id, studySetId },
        })
      }
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.rowMain}>
        <Text style={styles.rowMeta}>
          {formatDateTime(item.updatedAt ?? item.createdAt) ||
            `Chat ${index + 1}`}
        </Text>
        <Text style={styles.rowBody}>Study chat — tap to resume</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Delete conversation ${index + 1}`}
        hitSlop={10}
        disabled={remove.isPending}
        onPress={() =>
          Alert.alert(
            "Delete conversation?",
            "This removes its messages. This cannot be undone.",
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
        style={styles.deleteHit}
      >
        <SymbolView
          name={{ ios: "trash", android: "delete" }}
          tintColor={palette.danger}
          size={18}
        />
      </Pressable>
    </Pressable>
  );
}

function DecksSegment({
  studySetId,
  count,
  onCountChange,
}: {
  studySetId: string;
  count: number;
  onCountChange: (count: number) => void;
}) {
  const query = useDecks(studySetId);
  const generate = useGenerateFlashcards(studySetId);
  const { palette } = useTheme();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const build = async () => {
    try {
      const result = await generate.mutateAsync(count);
      router.push({
        pathname: "/(app)/deck/[id]",
        params: { id: result.deckId, studySetId },
      });
    } catch (error) {
      Alert.alert(
        "Unable to build deck",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  };
  return (
    <View style={styles.segment}>
      <View style={styles.practice}>
        <Text style={styles.practiceTitle}>Build a review deck</Text>
        <Text style={styles.practiceBody}>
          Focused questions from ready material in this set. Opens straight into
          review.
        </Text>
        <View style={styles.stepper}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fewer cards"
            disabled={generate.isPending || count <= 1}
            onPress={() => onCountChange(Math.max(1, count - 1))}
            style={({ pressed }) => [
              styles.stepButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.stepText}>−</Text>
          </Pressable>
          <Text style={styles.stepCount}>
            {count} {count === 1 ? "card" : "cards"}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="More cards"
            disabled={generate.isPending || count >= 20}
            onPress={() => onCountChange(Math.min(20, count + 1))}
            style={({ pressed }) => [
              styles.stepButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.stepText}>+</Text>
          </Pressable>
        </View>
        <Button
          title={generate.isPending ? "Building deck…" : "Build & review"}
          loading={generate.isPending}
          onPress={() => {
            hapticMedium();
            void build();
          }}
        />
      </View>
      {query.isPending ? <LoadingState label="Loading decks…" /> : null}
      {query.isError ? (
        <ErrorState
          message={query.error.message}
          onRetry={() => {
            void query.refetch();
          }}
        />
      ) : (
        query.items.map((item) => (
          <DeckRow key={item.id} item={item} studySetId={studySetId} />
        ))
      )}
      {!query.isPending && !query.isError && query.items.length === 0 ? (
        <EmptyState
          title="No decks yet"
          message="Build your first deck above — past decks collect here for re-review."
        />
      ) : null}
    </View>
  );
}

function DeckRow({ item, studySetId }: { item: Deck; studySetId: string }) {
  const { palette } = useTheme();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Review ${item.title}`}
      onPress={() =>
        router.push({
          pathname: "/(app)/deck/[id]",
          params: { id: item.id, studySetId },
        })
      }
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.rowMain}>
        <Text style={styles.rowMeta}>{formatDateTime(item.createdAt)}</Text>
        <Text style={styles.rowBody} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.rowMeta}>
          {item.cardCount} {item.cardCount === 1 ? "card" : "cards"} · Review ›
        </Text>
      </View>
      <SymbolView
        name={{ ios: "chevron.right", android: "chevron_right" }}
        tintColor={palette.faint}
        size={20}
      />
    </Pressable>
  );
}

function SummariesSegment({
  studySetId,
  generating,
  onGenerate,
  onOpen,
}: {
  studySetId: string;
  generating: boolean;
  onGenerate: () => void;
  onOpen: (title: string, content: string) => void;
}) {
  const query = useSummaries(studySetId);
  const remove = useDeleteSummary(studySetId);
  const { palette } = useTheme();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  if (query.isPending) return <LoadingState label="Loading summaries…" />;
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
    <View style={styles.segment}>
      <Button
        title={generating ? "Writing summary…" : "+ New summary"}
        variant="secondary"
        loading={generating}
        onPress={onGenerate}
      />
      {query.items.length === 0 && !generating ? (
        <EmptyState
          title="No summaries yet"
          message="Generate one before a lecture or the night before an exam — each version is kept here."
        />
      ) : (
        query.items.map((item, index) => (
          <SummaryRow
            key={item.id}
            item={item}
            index={query.items.length - index}
            studySetId={studySetId}
            deleting={remove.isPending}
            onDelete={() =>
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
                        onError: (error) =>
                          Alert.alert(
                            "Unable to delete summary",
                            error.message,
                          ),
                      }),
                  },
                ],
              )
            }
            onOpen={() =>
              onOpen(
                `Summary · ${formatDateTime(item.createdAt)}`,
                item.content,
              )
            }
          />
        ))
      )}
    </View>
  );
}

function SummaryRow({
  item,
  index,
  studySetId,
  deleting,
  onDelete,
  onOpen,
}: {
  item: Summary;
  index: number;
  studySetId: string;
  deleting: boolean;
  onDelete: () => void;
  onOpen: () => void;
}) {
  void studySetId;
  const { palette } = useTheme();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Read summary ${index}`}
      onPress={onOpen}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.rowMain}>
        <Text style={styles.rowMeta}>
          {formatDateTime(item.createdAt) || `Summary ${index}`}
        </Text>
        <Text style={styles.rowBody} numberOfLines={3}>
          {getSummaryPreview(item.content)}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Delete summary ${index}`}
        hitSlop={10}
        disabled={deleting}
        onPress={onDelete}
        style={styles.deleteHit}
      >
        <SymbolView
          name={{ ios: "trash", android: "delete" }}
          tintColor={palette.danger}
          size={18}
        />
      </Pressable>
    </Pressable>
  );
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    heading: { gap: 10 },
    hint: { color: palette.muted, fontSize: 14, lineHeight: 20 },
    actionBar: {
      flexDirection: "row",
      gap: 8,
      paddingVertical: 8,
      backgroundColor: palette.bg,
    },
    actionPrimary: {
      flex: 1.2,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      minHeight: 52,
      borderRadius: radius.md,
      backgroundColor: palette.primary,
      ...shadow.raised,
    },
    actionGhost: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 52,
      borderRadius: radius.md,
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.line,
    },
    actionPrimaryText: {
      color: palette.primaryInk,
      fontSize: 16,
      fontWeight: "800",
    },
    actionGhostText: { color: palette.ink, fontSize: 15, fontWeight: "700" },
    actionDisabled: { opacity: 0.45 },
    pressed: { opacity: 0.75 },
    body: { gap: 12 },
    segment: { gap: 10 },
    menuButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.line,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: palette.surface,
      borderRadius: radius.lg,
      padding: 14,
      borderWidth: 1,
      borderColor: palette.line,
    },
    rowMain: { flex: 1, gap: 4 },
    rowTop: { flexDirection: "row", alignItems: "center", gap: 10 },
    rowHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    rowType: { color: palette.primary, fontSize: 12, fontWeight: "800" },
    statusWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusText: { color: palette.body, fontSize: 12, fontWeight: "700" },
    rowBody: {
      color: palette.ink,
      fontSize: 15,
      lineHeight: 22,
      fontWeight: "600",
    },
    rowMeta: { color: palette.muted, fontSize: 13, lineHeight: 18 },
    rowError: { color: palette.danger, fontSize: 13, lineHeight: 18 },
    trashButton: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: palette.dangerSoft,
    },
    deleteHit: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    practice: {
      gap: 10,
      backgroundColor: palette.surface,
      borderRadius: radius.lg,
      padding: 16,
      borderWidth: 1,
      borderColor: palette.line,
      borderTopWidth: 3,
      borderTopColor: palette.primary,
    },
    practiceTitle: { color: palette.ink, fontSize: 18, fontWeight: "800" },
    practiceBody: { color: palette.muted, fontSize: 14, lineHeight: 20 },
    stepper: { flexDirection: "row", alignItems: "center", gap: 14 },
    stepButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: palette.pool,
    },
    stepText: { color: palette.ink, fontSize: 24, fontWeight: "700" },
    stepCount: { flex: 1, color: palette.ink, fontSize: 16, fontWeight: "800" },
  });
