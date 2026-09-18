import { Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";

import { hapticSelection } from "@/lib/haptics";
import { useTheme } from "@/stores/theme-store";

/**
 * Platform-standard bottom tabs: three task destinations, nothing custom.
 * Settings moved out — the account avatar opens it from Study and Library.
 */
export default function TabsLayout() {
  const { palette } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.faint,
        tabBarLabelStyle: { fontSize: 12, fontWeight: "700" },
        tabBarStyle: {
          backgroundColor: palette.surface,
          borderTopWidth: 1,
          borderTopColor: palette.line,
        },
      }}
      screenListeners={{
        tabPress: () => {
          hapticSelection();
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Study",
          tabBarLabel: "Study",
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              name={{ android: "auto_stories", ios: "book" }}
              tintColor={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: "Library",
          tabBarLabel: "Library",
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              name={{ android: "library_books", ios: "books.vertical" }}
              tintColor={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: "Activity",
          tabBarLabel: "Activity",
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              name={{ android: "history", ios: "clock" }}
              tintColor={color}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}
