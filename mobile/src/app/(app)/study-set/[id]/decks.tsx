import { Link, Stack, router, useLocalSearchParams } from "expo-router";
import { SymbolView } from "expo-symbols";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  styles as ui,
} from "@/components/ui";
import { useDecks } from "@/features/study/api";

export default function Decks() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const query = useDecks(id);
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
                Flashcard decks
              </Text>
              <View style={styles.navSpacer} />
            </View>
            <Card style={styles.hero}>
              <Text style={styles.eyebrow}>DECKS</Text>
              <Text style={styles.heroTitle}>Flashcard decks</Text>
              <Text style={styles.heroSubtitle}>
                {query.items.length
                  ? `${query.items.length} saved ${query.items.length === 1 ? "deck" : "decks"} — tap one to review it.`
                  : "Generated decks will appear here."}
              </Text>
            </Card>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="No decks yet"
            message="Generate flashcards after a source finishes processing."
          />
        }
        renderItem={({ item, index }) => (
          <Link
            href={{
              pathname: "/deck/[id]",
              params: { id: item.id, studySetId: id },
            }}
            asChild
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open deck ${index + 1}`}
              style={({ pressed }) => [pressed && styles.pressed]}
            >
              <Card style={styles.item}>
                <View style={styles.row}>
                  <View style={styles.iconWrap}>
                    <SymbolView
                      name={{ ios: "square.stack.3d.up", android: "style" }}
                      tintColor="#4F46E5"
                      size={22}
                    />
                  </View>
                  <View style={styles.copy}>
                    <Text style={styles.date}>
                      {item.createdAt?.toLocaleString() ?? `Deck ${index + 1}`}
                    </Text>
                    <Text style={styles.title} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={styles.link}>
                      {item.cardCount}{" "}
                      {item.cardCount === 1 ? "card" : "cards"} · Review deck ›
                    </Text>
                  </View>
                  <SymbolView
                    name={{ ios: "chevron.right", android: "chevron_right" }}
                    tintColor="#94A3B8"
                    size={20}
                  />
                </View>
              </Card>
            </Pressable>
          </Link>
        )}
      />
    </>
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
  date: { color: "#4F46E5", fontSize: 12, fontWeight: "800" },
  title: { color: "#0F172A", fontSize: 17, fontWeight: "800" },
  link: { color: "#4F46E5", fontWeight: "700" },
  pressed: { opacity: 0.85 },
});
