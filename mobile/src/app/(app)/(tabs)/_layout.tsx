import { Tabs } from "expo-router";

import { SymbolView } from "expo-symbols";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { hapticSelection } from "@/lib/haptics";
import { palette, radius, shadow } from "@/theme";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  // Floating rounded bar — bottom margin respects the system gesture area
  // so content and OS buttons are never covered. Pure JS style, OTA-safe.
  const tabBottom = Math.max(insets.bottom, 12);
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.faint,
        headerShown: false,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
        tabBarStyle: {
          position: "absolute",
          left: 52,
          right: 52,
          bottom: tabBottom,
          height: 68,
          borderRadius: radius.pill,
          backgroundColor: palette.surface,
          borderWidth: 1,
          borderColor: palette.line,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 10,
          ...shadow.card,
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
