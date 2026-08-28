import { Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { styles as ui } from "@/components/ui";

export default function Subscriptions() {
  return (
    <View style={[ui.screen, ui.center]}>
      <Stack.Screen options={{ title: "Plans" }} />
      <Text style={styles.title}>Premium is coming soon</Text>
      <Text style={ui.muted}>
        Subscription features are intentionally not enabled yet.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    color: "#0F172A",
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
  },
});
