import { Link, Stack, router, useLocalSearchParams } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  styles as ui,
} from "@/components/ui";
import {
  useConversation,
  useCreateSource,
  useDecks,
  useDeleteSource,
  useDeleteStudySet,
  useGenerateFlashcards,
  useGenerateSummary,
  useRetrySource,
  useSources,
  useStudySet,
  useSummaries,
} from "@/features/study/api";
import { FlashcardCountForm } from "@/features/study/components/flashcard-count-form";
import { PdfSourceForm } from "@/features/study/components/pdf-source-form";
import { SourceForm } from "@/features/study/components/source-form";
import type { Source } from "@/features/study/types";

export default function StudySetDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [sourceMode, setSourceMode] = useState<"note" | "web" | null>(null);
  const [sourcePickerOpen, setSourcePickerOpen] = useState(false);
  const [pdfUploadOpen, setPdfUploadOpen] = useState(false);
  const [generatedDeckId, setGeneratedDeckId] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const set = useStudySet(id);
  const sources = useSources(id);
  const summaries = useSummaries(id);
  const decks = useDecks(id);
  const createSource = useCreateSource(id);
  const generateSummary = useGenerateSummary(id);
  const generateCards = useGenerateFlashcards(id);
  const askAi = useConversation(id);
  const deleteSet = useDeleteStudySet();
  const startChat = () => {
    askAi.mutate(undefined, {
      onSuccess: (conversation) =>
        router.push({
          pathname: "/chat/[id]",
          params: { id: conversation.id, studySetId: id },
        }),
      onError: (error) =>
        Alert.alert("Unable to start chat", error.message),
    });
  };
  const insets = useSafeAreaInsets();

  if (set.isPending) return <LoadingState />;
  if (set.isError)
    return (
      <ErrorState
        message={set.error.message}
        onRetry={() => {
          void set.refetch();
        }}
      />
    );
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
    <KeyboardAvoidingView
      style={ui.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <FlatList<Source>
        contentInsetAdjustmentBehavior="automatic"
        style={ui.screen}
        contentContainerStyle={[
          ui.content,
          {
            paddingTop: Math.max(insets.top, 12) + 4,
            paddingBottom: Math.max(insets.bottom, 16) + 24,
          },
        ]}
        data={sources.items}
        keyExtractor={(item) => item.id}
        onEndReached={() => {
          if (sources.hasNextPage && !sources.isFetchingNextPage)
            void sources.fetchNextPage();
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
                  pressed && styles.backButtonPressed,
                ]}
              >
                <SymbolView
                  name={{ ios: "chevron.left", android: "arrow_back" }}
                  tintColor="#0F172A"
                  size={22}
                />
              </Pressable>
              <Text numberOfLines={1} style={styles.navTitle}>
                {set.data.title}
              </Text>
              <View style={styles.navSpacer} />
            </View>
            <Card style={styles.hero}>
              <Text style={styles.heroTitle}>{set.data.title}</Text>
              <Text style={styles.heroSubtitle}>
                Build a focused revision space from your own material.
              </Text>
              <View style={styles.actions}>
                <View style={styles.actionFlex}>
                  <Button
                    title="+ Add source"
                    onPress={() => setSourcePickerOpen(true)}
                  />
                </View>
                {sources.items.length > 0 ? (
                  <View style={styles.actionFlex}>
                    <Button
                      title="Ask AI"
                      variant="secondary"
                      loading={askAi.isPending}
                      onPress={startChat}
                    />
                  </View>
                ) : null}
              </View>
            </Card>
            <SectionTitle title="Sources" />
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="No sources yet"
            message="Add a PDF, note, or web page to start processing your material."
          />
        }
        renderItem={({ item }) => <SourceRow item={item} studySetId={id} />}
        ListFooterComponent={
          <View style={styles.footer}>
            <SectionTitle title="Study tools" />
            <Card>
              <Text style={styles.cardTitle}>Summary</Text>
              {summaries.isError ? (
                <>
                  <Text style={styles.error} selectable>
                    {summaries.error.message}
                  </Text>
                  <Button
                    title="Retry summaries"
                    variant="secondary"
                    onPress={() => {
                      void summaries.refetch();
                    }}
                  />
                </>
              ) : (
                <>
                  {summaries.items[0]?.content ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Open full summary"
                      onPress={() => setSummaryOpen(true)}
                    >
                      <Text numberOfLines={3} selectable style={styles.preview}>
                        {getSummaryPreview(summaries.items[0].content)}
                      </Text>
                      <Text style={styles.link}>Read full summary ›</Text>
                    </Pressable>
                  ) : (
                    <Text style={ui.muted}>
                      Generate a concise Markdown summary once a source is
                      ready.
                    </Text>
                  )}
                  <Button
                    title="Generate summary"
                    loading={generateSummary.isPending}
                    onPress={() => {
                      generateSummary.mutate(undefined, {
                        onSuccess: () => {
                          Alert.alert(
                            "Summary ready",
                            "View the generated summary now?",
                            [
                              { text: "Later", style: "cancel" },
                              {
                                text: "View",
                                onPress: () => setSummaryOpen(true),
                              },
                            ],
                          );
                        },
                        onError: (error) =>
                          Alert.alert(
                            "Unable to generate summary",
                            error.message,
                          ),
                      });
                    }}
                  />
                  <Button
                    title="View summary history"
                    variant="secondary"
                    onPress={() =>
                      router.push({
                        pathname: "/study-set/[id]/summaries",
                        params: { id },
                      })
                    }
                  />
                </>
              )}
            </Card>
            <Card>
              <Text style={styles.cardTitle}>Flashcards</Text>
              {decks.isError ? (
                <>
                  <Text style={styles.error} selectable>
                    {decks.error.message}
                  </Text>
                  <Button
                    title="Retry decks"
                    variant="secondary"
                    onPress={() => {
                      void decks.refetch();
                    }}
                  />
                </>
              ) : (
                <>
                  <Text style={ui.muted}>
                    {decks.items[0]
                      ? `${decks.items[0].cardCount} cards ready`
                      : "Turn your processed material into a review deck."}
                  </Text>
                  {decks.items[0] ? (
                    <Link
                      href={{
                        pathname: "/deck/[id]",
                        params: { id: decks.items[0].id, studySetId: id },
                      }}
                      asChild
                    >
                      <Pressable>
                        <Text style={styles.link}>Review latest deck ›</Text>
                      </Pressable>
                    </Link>
                  ) : null}
                  <FlashcardCountForm
                    disabled={generateCards.isPending}
                    onSubmit={async (count) => {
                      try {
                        const result = await generateCards.mutateAsync(count);
                        setGeneratedDeckId(result.deckId);
                        Alert.alert(
                          "Deck ready",
                          "View the generated flashcards now?",
                          [
                            { text: "Later", style: "cancel" },
                            {
                              text: "Review",
                              onPress: () =>
                                router.push({
                                  pathname: "/deck/[id]",
                                  params: {
                                    id: result.deckId,
                                    studySetId: id,
                                  },
                                }),
                            },
                          ],
                        );
                      } catch {
                        /* the mutation error is shown below */
                      }
                    }}
                  />
                  {generateCards.isPending ? (
                    <View style={styles.processing}>
                      <ActivityIndicator color="#4F46E5" />
                      <Text style={styles.processingTitle}>
                        Building your review deck...
                      </Text>
                      <Text style={ui.muted}>
                        Creating focused questions from your processed sources.
                      </Text>
                    </View>
                  ) : null}
                  {generatedDeckId ? (
                    <Button
                      title="Review generated flashcards"
                      onPress={() =>
                        router.push({
                          pathname: "/deck/[id]",
                          params: { id: generatedDeckId, studySetId: id },
                        })
                      }
                    />
                  ) : null}
                  <Button
                    title="View deck history"
                    variant="secondary"
                    onPress={() =>
                      router.push({
                        pathname: "/study-set/[id]/decks",
                        params: { id },
                      })
                    }
                  />
                </>
              )}
            </Card>
            <Card style={styles.manage}>
              <Text style={styles.cardTitle}>Manage</Text>
              <Button
                title="Edit study-set title"
                variant="secondary"
                onPress={() =>
                  router.push({
                    pathname: "/study-set/[id]/edit",
                    params: { id },
                  })
                }
              />
              <Button
                title="View chat history"
                variant="secondary"
                onPress={() =>
                  router.push({
                    pathname: "/study-set/[id]/conversations",
                    params: { id },
                  })
                }
              />
              <Button
                title="Delete study set"
                variant="danger"
                onPress={() =>
                  Alert.alert(
                    "Delete study set?",
                    "This removes the study set, its sources, and generated study material.",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: () =>
                          deleteSet.mutate(id, {
                            onSuccess: () => router.replace("/(app)/(tabs)"),
                            onError: (error) =>
                              Alert.alert(
                                "Unable to delete study set",
                                error.message,
                              ),
                          }),
                      },
                    ],
                  )
                }
                loading={deleteSet.isPending}
              />
            </Card>
            {generateSummary.isError ? (
              <Text style={styles.error} selectable>
                {generateSummary.error.message}
              </Text>
            ) : null}
            {generateCards.isError ? (
              <Text style={styles.error} selectable>
                {generateCards.error.message}
              </Text>
            ) : null}
          </View>
        }
      />
      {summaries.items[0]?.content ? (
        <SummaryReaderModal
          visible={summaryOpen}
          title={set.data.title}
          content={summaries.items[0].content}
          onClose={() => setSummaryOpen(false)}
        />
      ) : null}
      <SourcePickerModal
        visible={sourcePickerOpen}
        onClose={() => setSourcePickerOpen(false)}
        onSelect={(mode) => {
          setSourcePickerOpen(false);
          if (mode === "pdf") {
            setPdfUploadOpen(true);
          } else {
            setSourceMode(mode);
          }
        }}
      />
      <SourceEntryModal
        mode={sourceMode}
        studySetId={id}
        mutation={createSource}
        onClose={() => setSourceMode(null)}
      />
      {pdfUploadOpen ? (
        <PdfSourceForm
          studySetId={id}
          autoOpen
          onDone={() => setPdfUploadOpen(false)}
          onClose={() => setPdfUploadOpen(false)}
        />
      ) : null}
    </KeyboardAvoidingView>
  );
}

function SourceRow({ item, studySetId }: { item: Source; studySetId: string }) {
  const retry = useRetrySource(studySetId);
  const remove = useDeleteSource(studySetId);
  const active = item.status === "pending" || item.status === "processing";
  return (
    <Card>
      <View style={styles.sourceHeader}>
        <Text style={styles.sourceType}>{item.type.toUpperCase()}</Text>
        <View
          style={[
            styles.statusPill,
            item.status === "ready"
              ? styles.readyPill
              : item.status === "failed"
                ? styles.failedPill
                : styles.processingPill,
          ]}
        >
          {active ? <ActivityIndicator size="small" color="#4F46E5" /> : null}
          <Text style={styles.statusText}>
            {active
              ? item.status === "pending"
                ? "Queued"
                : "Processing"
              : item.status === "ready"
                ? "Ready"
                : "Failed"}
          </Text>
        </View>
      </View>
      <Text selectable style={styles.sourceText} numberOfLines={3}>
        {item.type === "web" ? item.url : item.content}
      </Text>
      {active ? (
        <Text style={styles.processingText}>
          {item.status === "pending"
            ? "Waiting to be processed…"
            : "Extracting content and preparing study tools…"}
        </Text>
      ) : null}
      {item.error_message ? (
        <Text style={styles.error} selectable>
          {item.error_message}
        </Text>
      ) : null}
      <View style={styles.sourceActions}>
        {/* Retry for failed sources, and for PDFs stuck in `pending` (their
            upload never completed — retrying surfaces a clear error instead
            of an endless "Queued" state). */}
        {item.status === "failed" ||
        (item.status === "pending" && item.type === "pdf") ? (
          <Button
            title={retry.isPending ? "Retrying..." : "Retry"}
            onPress={() =>
              retry.mutate(item.id, {
                onError: (error) =>
                  Alert.alert("Unable to retry source", error.message),
              })
            }
            disabled={retry.isPending}
          />
        ) : null}
        <Button
          title="Delete"
          variant="danger"
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
          disabled={remove.isPending}
        />
      </View>
    </Card>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.section}>{title}</Text>;
}

function SourcePickerModal({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (mode: "note" | "web" | "pdf") => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.pickerBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.picker}>
          <Text style={styles.pickerTitle}>Add source</Text>
          <Text style={styles.pickerSubtitle}>
            Choose the type of study material.
          </Text>
          <Button title="PDF document" onPress={() => onSelect("pdf")} />
          <Button title="Note" onPress={() => onSelect("note")} />
          <Button title="Web page" onPress={() => onSelect("web")} />
          <Button title="Cancel" variant="secondary" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

function SourceEntryModal({
  mode,
  studySetId,
  mutation,
  onClose,
}: {
  mode: "note" | "web" | null;
  studySetId: string;
  mutation: {
    mutateAsync: (
      input:
        | { type: "note"; studySetId: string; content: string }
        | { type: "web"; studySetId: string; url: string },
    ) => Promise<unknown>;
    isPending: boolean;
    error: Error | null;
  };
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={mode !== null}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalKeyboard}
        behavior={Platform.OS === "android" ? "height" : "padding"}
        keyboardVerticalOffset={Platform.OS === "android" ? 24 : 0}
      >
        <View style={styles.pickerBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          <View
            style={[
              styles.entrySheet,
              { paddingBottom: Math.max(insets.bottom, 18) },
            ]}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.entryScroll}
            >
              <View style={styles.entryHeader}>
                <Text style={styles.pickerTitle}>
                  {mode === "note" ? "Add a note" : "Add a web page"}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close source form"
                  onPress={onClose}
                  style={styles.close}
                >
                  <Text style={styles.closeText}>×</Text>
                </Pressable>
              </View>
              {mode ? (
                <SourceForm
                  key={mode}
                  studySetId={studySetId}
                  initialType={mode}
                  mutation={mutation}
                  onDone={onClose}
                />
              ) : null}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: { gap: 12 },
  preview: { color: "#334155", fontSize: 15, lineHeight: 22 },
  footer: { gap: 12, paddingTop: 8 },
  title: { color: "#0F172A", fontSize: 30, fontWeight: "800" },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
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
  backButtonPressed: { opacity: 0.7, transform: [{ scale: 0.94 }] },
  navTitle: { flex: 1, color: "#0F172A", fontSize: 17, fontWeight: "700" },
  navSpacer: { width: 40 },
  hero: { gap: 10 },
  heroTitle: { color: "#0F172A", fontSize: 24, fontWeight: "800" },
  heroSubtitle: { color: "#64748B", fontSize: 14, lineHeight: 20 },
  actions: { flexDirection: "row", gap: 10, marginTop: 4 },
  actionFlex: { flex: 1 },
  manage: { gap: 10 },
  sourceActions: { flexDirection: "column", gap: 8 },
  section: { color: "#0F172A", fontSize: 21, fontWeight: "800", marginTop: 8 },
  sourceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  sourceType: {
    color: "#4F46E5",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  processingPill: { backgroundColor: "#DBEAFE" },
  readyPill: { backgroundColor: "#DCFCE7" },
  failedPill: { backgroundColor: "#FEE2E2" },
  statusText: { color: "#334155", fontSize: 12, fontWeight: "700" },
  processingText: { color: "#64748B", fontSize: 13 },
  sourceText: { color: "#0F172A", fontSize: 16, fontWeight: "600" },
  processing: {
    alignItems: "center",
    gap: 6,
    borderRadius: 14,
    padding: 14,
    backgroundColor: "#EFF6FF",
  },
  processingTitle: { color: "#4338CA", fontWeight: "700" },
  cardTitle: { color: "#0F172A", fontSize: 18, fontWeight: "700" },
  link: { color: "#4F46E5", fontWeight: "700" },
  error: { color: "#B91C1C", textAlign: "center" },
  pickerBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.42)",
  },
  picker: {
    gap: 10,
    padding: 20,
    paddingBottom: 30,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: "#FFFFFF",
  },
  modalKeyboard: { flex: 1 },
  entrySheet: {
    maxHeight: "90%",
    paddingTop: 6,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: "#FFFFFF",
  },
  entryScroll: { paddingTop: 6 },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
  },
  closeText: { color: "#334155", fontSize: 25, lineHeight: 28 },
  pickerTitle: { color: "#0F172A", fontSize: 22, fontWeight: "800" },
  pickerSubtitle: { color: "#64748B", fontSize: 14, marginBottom: 4 },
});
