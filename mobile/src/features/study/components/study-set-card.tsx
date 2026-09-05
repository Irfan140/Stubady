import { Link } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/ui";
import { hapticSelection } from "@/lib/haptics";
import { palette, radius } from "@/theme";
import type { StudySet } from "../types";

const palettes = [
  { tint: "#EEF0FE", accent: "#4F46E5", badge: "#E0E4FF" },
  { tint: "#E9FAF5", accent: "#0F766E", badge: "#CBF3E6" },
  { tint: "#FFF4E8", accent: "#C2410C", badge: "#FFE6CC" },
  { tint: "#FAF0FE", accent: "#A21CAF", badge: "#F5DDFB" },
  { tint: "#F3F9E4", accent: "#4D7C0F", badge: "#E4F4C6" },
  { tint: "#FDEEF1", accent: "#BE123C", badge: "#FBDCE2" },
];

function paletteFor(id: string) {
  const hash = [...id].reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );
  return palettes[hash % palettes.length];
}

export function StudySetCard({ item }: { item: StudySet }) {
  const paletteChoice = paletteFor(item.id);
  return (
    <Link
      href={{ pathname: "/study-set/[id]", params: { id: item.id } }}
      asChild
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.title}`}
        onPressIn={() => hapticSelection()}
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        <Card>
          <View
            style={[styles.cardTop, { backgroundColor: paletteChoice.tint }]}
          >
            <View
              style={[styles.badge, { backgroundColor: paletteChoice.badge }]}
            >
              <Text style={[styles.badgeText, { color: paletteChoice.accent }]}>
                STUDY SET
              </Text>
            </View>
            <SymbolView
              name={{ ios: "chevron.right", android: "chevron_right" }}
              tintColor={paletteChoice.accent}
              size={22}
            />
          </View>
          <View style={styles.body}>
            <Text selectable numberOfLines={2} style={styles.title}>
              {item.title}
            </Text>
            <Text style={styles.subtitle}>
              Sources, summaries, and flashcards
            </Text>
            <View style={styles.meta}>
              <View
                style={[styles.dot, { backgroundColor: paletteChoice.accent }]}
              />
              <Text style={styles.date}>
                {item.createdAt
                  ? `Created ${item.createdAt.toLocaleDateString()}`
                  : "Ready to learn"}
              </Text>
            </View>
          </View>
        </Card>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  cardTop: {
    minHeight: 52,
    margin: -18,
    marginBottom: 2,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  badge: {
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: { fontSize: 10, fontWeight: "800", letterSpacing: 1.1 },
  body: { gap: 6, paddingTop: 4 },
  title: {
    color: palette.ink,
    fontSize: 19,
    lineHeight: 25,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  subtitle: { color: palette.muted, fontSize: 14, lineHeight: 20 },
  meta: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 4 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  date: { color: palette.faint, fontSize: 12, fontWeight: "600" },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
});
