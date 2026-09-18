import { useClerk, useUser } from "@clerk/expo";
import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Avatar,
  Button,
  Card,
  Screen,
  TopBar,
  useUiStyles,
} from "@/components/ui";
import { hapticSelection, hapticWarning } from "@/lib/haptics";
import { useTheme, type ThemePreference } from "@/stores/theme-store";
import { radius, type Palette } from "@/theme";

const APPEARANCE_OPTIONS: {
  value: ThemePreference;
  title: string;
  subtitle: string;
}[] = [
  { value: "system", title: "System", subtitle: "Follow device settings" },
  { value: "light", title: "Light", subtitle: "Always light" },
  { value: "dark", title: "Dark", subtitle: "Always dark" },
];

export default function Settings() {
  const { signOut } = useClerk();
  const { user } = useUser();
  const { palette, preference, setPreference } = useTheme();
  const ui = useUiStyles();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const insets = useSafeAreaInsets();
  const [signingOut, setSigningOut] = useState(false);
  const confirmSignOut = () => {
    hapticWarning();
    return Alert.alert(
      "Sign out?",
      "You can sign back in whenever you are ready.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign out",
          style: "destructive",
          onPress: () => {
            setSigningOut(true);
            void signOut().catch(() => setSigningOut(false));
          },
        },
      ],
    );
  };
  return (
    <Screen>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          ui.content,
          {
            paddingTop: Math.max(insets.top, 12) + 4,
            paddingBottom: 32,
          },
        ]}
      >
        <TopBar title="Settings" />
        <Card style={styles.profileCard}>
          <View style={styles.profileTop}>
            <Avatar imageUrl={user?.imageUrl} name={user?.fullName} size={56} />
            <Text style={styles.name} numberOfLines={1}>
              {user?.fullName ?? "Student"}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
              hitSlop={8}
              onPress={() => router.push("/(app)/edit-profile")}
              style={({ pressed }) => [
                styles.editRow,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.editText}>Edit ›</Text>
            </Pressable>
          </View>
          <Text selectable style={styles.email}>
            {user?.primaryEmailAddress?.emailAddress ?? "No email available"}
          </Text>
        </Card>
        <Card>
          <Text style={styles.cardTitle}>Appearance</Text>
          {APPEARANCE_OPTIONS.map((option) => {
            const selected = preference === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityLabel={`${option.title} theme`}
                accessibilityState={{ selected }}
                onPress={() => {
                  hapticSelection();
                  setPreference(option.value);
                }}
                style={({ pressed }) => [
                  styles.optionRow,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.rowCopy}>
                  <Text style={styles.rowTitle}>{option.title}</Text>
                  <Text style={styles.rowSubtitle}>{option.subtitle}</Text>
                </View>
                {selected ? (
                  <SymbolView
                    name={{ ios: "checkmark", android: "check" }}
                    tintColor={palette.primary}
                    size={20}
                  />
                ) : null}
              </Pressable>
            );
          })}
        </Card>
        <Card>
          <Text style={styles.cardTitle}>About Stubady</Text>
          <Text style={styles.about}>
            Your materials stay yours. Chats, summaries, and flashcards are
            built only from the sources you add — delete any of it, any time.
          </Text>
          <Text style={styles.version}>Version 1.0.0</Text>
        </Card>
        <Button
          title="Sign out"
          variant="danger"
          loading={signingOut}
          onPress={confirmSignOut}
        />
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    profileCard: { gap: 10 },
    profileTop: { flexDirection: "row", alignItems: "center", gap: 12 },
    name: { flex: 1, color: palette.ink, fontSize: 20, fontWeight: "800" },
    email: { color: palette.muted, fontSize: 14, lineHeight: 20 },
    editRow: { minHeight: 44, justifyContent: "center" },
    editText: { color: palette.primary, fontSize: 14, fontWeight: "800" },
    rowCopy: { flex: 1, gap: 2 },
    rowTitle: { color: palette.ink, fontSize: 16, fontWeight: "700" },
    rowSubtitle: { color: palette.muted, fontSize: 13, lineHeight: 18 },
    optionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      minHeight: 56,
      paddingHorizontal: 4,
      borderRadius: radius.md,
    },
    cardTitle: { color: palette.ink, fontSize: 18, fontWeight: "800" },
    about: { color: palette.muted, fontSize: 14, lineHeight: 20 },
    version: { color: palette.faint, fontSize: 12, fontWeight: "600" },
    pressed: { opacity: 0.7 },
  });
