import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerBackButtonDisplayMode: "minimal" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="study-set/[id]/summaries"
        options={{ presentation: "modal", title: "Summary" }}
      />
    </Stack>
  );
}
