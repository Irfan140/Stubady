import { Link } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/ui";
import { hapticSelection } from "@/lib/haptics";
import { palette, radius } from "@/theme";
import type { StudySet } from "../types";

export function StudySetCard({ item }: { item: StudySet }) {
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
        <Card style={styles.card}>
          <View style={styles.row}>
            <View style={styles.iconWrap}>
              <SymbolView
                name={{ ios: "books.vertical", android: "library_books" }}
                tintColor={palette.primary}
                size={22}
              />
            </View>
            <View style={styles.copy}>
              <Text selectable numberOfLines={2} style={styles.title}>
                {item.title}
              </Text>
              <Text numberOfLines={1} style={styles.subtitle}>
                Sources, summaries, and flashcards
              </Text>
              <View style={styles.meta}>
                <SymbolView
                  name={{ ios: "calendar", android: "calendar_month" }}
                  tintColor={palette.faint}
                  size={12}
                />
                <Text style={styles.date}>
                  {item.createdAt
                    ? `Created ${item.createdAt.toLocaleDateString()}`
                    : "Ready to learn"}
                </Text>
              </View>
            </View>
            <SymbolView
              name={{ ios: "chevron.right", android: "chevron_right" }}
              tintColor={palette.faint}
              size={20}
            />
          </View>
        </Card>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: palette.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: { flex: 1, gap: 3 },
  title: {
    color: palette.ink,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  subtitle: { color: palette.muted, fontSize: 13, lineHeight: 18 },
  meta: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 3 },
  date: { color: palette.faint, fontSize: 12, fontWeight: "600" },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
});
