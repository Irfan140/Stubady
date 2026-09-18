import { Stack } from "expo-router";

/**
 * Every product route lives under (app), so the root Stack.Protected guard
 * covers chat, decks, and creation flows too. Native headers stay off —
 * each screen renders the shared TopBar for one consistent header system.
 */
export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="study-set/[id]" />
      <Stack.Screen name="chat/[id]" />
      <Stack.Screen name="deck/[id]" />
      <Stack.Screen name="new-study-set" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="edit-profile" />
    </Stack>
  );
}
