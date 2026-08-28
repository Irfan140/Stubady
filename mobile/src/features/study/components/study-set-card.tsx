import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/ui";
import type { StudySet } from "../types";

const palettes = [
  { tint: "#EFF6FF", accent: "#2563EB", badge: "#DBEAFE" },
  { tint: "#F0FDFA", accent: "#0F766E", badge: "#CCFBF1" },
  { tint: "#FFF7ED", accent: "#C2410C", badge: "#FFEDD5" },
  { tint: "#FDF4FF", accent: "#A21CAF", badge: "#FAE8FF" },
  { tint: "#F7FEE7", accent: "#4D7C0F", badge: "#ECFCCB" },
  { tint: "#FFF1F2", accent: "#BE123C", badge: "#FFE4E6" },
];

function paletteFor(id: string) {
  const hash = [...id].reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );
  return palettes[hash % palettes.length];
}

export function StudySetCard({ item }: { item: StudySet }) {
  const palette = paletteFor(item.id);
  return (
    <Link
      href={{ pathname: "/study-set/[id]", params: { id: item.id } }}
      asChild
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.title}`}
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        <Card>
          <View style={[styles.cardTop, { backgroundColor: palette.tint }]}>
            <View style={[styles.badge, { backgroundColor: palette.badge }]}>
              <Text style={[styles.badgeText, { color: palette.accent }]}>
                STUDY SET
              </Text>
            </View>
            <Text style={[styles.arrow, { color: palette.accent }]}>›</Text>
          </View>
          <View style={styles.body}>
            <Text selectable numberOfLines={2} style={styles.title}>
              {item.title}
            </Text>
            <Text style={styles.subtitle}>
              Sources, summaries, and flashcards
            </Text>
            <View style={styles.meta}>
              <View style={[styles.dot, { backgroundColor: palette.accent }]} />
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
    minHeight: 48,
    margin: -18,
    marginBottom: 2,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  badge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  badgeText: { fontSize: 10, fontWeight: "800", letterSpacing: 1.1 },
  arrow: { fontSize: 30, lineHeight: 30 },
  body: { gap: 6, paddingTop: 4 },
  title: { color: "#0F172A", fontSize: 19, lineHeight: 25, fontWeight: "800" },
  subtitle: { color: "#64748B", fontSize: 14, lineHeight: 20 },
  meta: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 4 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  date: { color: "#94A3B8", fontSize: 12, fontWeight: "600" },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
});
