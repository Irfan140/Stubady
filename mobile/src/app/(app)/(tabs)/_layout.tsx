import { Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ tabBarActiveTintColor: "#2563EB", headerShown: false }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Study sets",
          tabBarLabel: "Study sets",
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              name={{ android: "menu_book", ios: "book" }}
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
