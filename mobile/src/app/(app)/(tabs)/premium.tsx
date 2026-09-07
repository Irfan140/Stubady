import { StatusBar } from "expo-status-bar";
import { SymbolView } from "expo-symbols";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState, styles as ui } from "@/components/ui";
import { palette } from "@/theme";

// Blank placeholder — subscription work (RevenueCat) lands here later.
// No logic or native modules, so this stays OTA-safe.
export default function Premium() {
  const insets = useSafeAreaInsets();
  return (
    <View style={ui.screen}>
      <StatusBar style="dark" />
      <View
        style={[
          styles.wrap,
          {
            paddingTop: Math.max(insets.top, 16) + 8,
            paddingBottom: Math.max(insets.bottom, 12) + 92,
          },
        ]}
      >
        <EmptyState
          icon={
            <SymbolView
              name={{ ios: "star.circle", android: "workspace_premium" }}
              tintColor={palette.primary}
              size={32}
            />
          }
          title="Premium"
          message="Subscriptions will live here soon."
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: "center", paddingHorizontal: 20 },
});
