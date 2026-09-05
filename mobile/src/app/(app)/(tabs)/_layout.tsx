import { Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";

import { hapticSelection } from "@/lib/haptics";
import { palette } from "@/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.faint,
        headerShown: false,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
        tabBarStyle: {
          backgroundColor: palette.surface,
          borderTopColor: palette.line,
          borderTopWidth: 1,
          height: 68,
          paddingTop: 8,
          paddingBottom: 12,
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
          title: "Study sets",
          tabBarLabel: "Study sets",
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
        name="settings"
        options={{
          title: "Settings",
          tabBarLabel: "Settings",
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              name={{ android: "settings", ios: "gearshape" }}
              tintColor={color}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}
