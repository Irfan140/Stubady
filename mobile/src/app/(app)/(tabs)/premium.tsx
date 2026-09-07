import { StatusBar } from "expo-status-bar";
import { SymbolView } from "expo-symbols";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card, styles as ui } from "@/components/ui";
import { palette, radius } from "@/theme";

// No purchases here yet — this screen explains why Premium exists so the
// future RevenueCat paywall lands on an honest message. Static UI only,
// so it stays OTA-safe.
export default function Premium() {
  const insets = useSafeAreaInsets();
  return (
    <View style={ui.screen}>
      <StatusBar style="dark" />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 16) + 8,
            paddingBottom: Math.max(insets.bottom, 12) + 92,
          },
        ]}
      >
        <Text style={styles.title}>Premium</Text>
        <Card style={styles.hero}>
          <View style={styles.iconWrap}>
            <SymbolView
              name={{ ios: "star.circle", android: "workspace_premium" }}
              tintColor={palette.primary}
              size={28}
            />
          </View>
          <Text style={styles.quote}>
            “Good study tools cost money to run — every summary, deck, and
            chat answer uses real AI compute. Charging for Premium keeps
            Stubady ad-free, independent, and improving, instead of selling
            your data.”
          </Text>
        </Card>
        <Card style={styles.planCard}>
          <View style={styles.planPill}>
            <Text style={styles.planText}>Free plan</Text>
          </View>
          <Text style={styles.planNote}>
            You’re on the Free plan. Paid plans aren’t open yet — they’ll
            appear here when subscriptions launch.
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 14, paddingBottom: 32 },
  title: {
    color: palette.ink,
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.8,
    marginBottom: 2,
  },
  hero: { alignItems: "center", gap: 12, paddingVertical: 24 },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: palette.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  quote: {
    color: palette.body,
    fontSize: 16,
    lineHeight: 25,
    fontStyle: "italic",
    textAlign: "center",
  },
  planCard: { gap: 10 },
  planPill: {
    alignSelf: "flex-start",
    backgroundColor: palette.successSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  planText: { color: palette.success, fontSize: 12, fontWeight: "700" },
  planNote: { color: palette.muted, fontSize: 14, lineHeight: 21 },
});
