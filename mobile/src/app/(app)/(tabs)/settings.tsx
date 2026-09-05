import { useClerk, useUser } from "@clerk/expo";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar, Button, Card, styles as ui } from "@/components/ui";
import { hapticSelection, hapticWarning } from "@/lib/haptics";
import { palette, radius, shadow } from "@/theme";

export default function Settings() {
  const { signOut } = useClerk();
  const { user } = useUser();
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
    <View style={ui.screen}>
      <StatusBar style="dark" />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 16) + 8,
            paddingBottom: Math.max(insets.bottom, 16) + 24,
          },
        ]}
      >
        <View style={styles.heading}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>ACCOUNT</Text>
          </View>
          <Text style={styles.title}>Settings</Text>
          <Text style={ui.muted}>
            Manage your profile and study experience.
          </Text>
        </View>
        <Card style={styles.profileCard}>
          <View style={styles.profileGlow} />
          <View style={styles.profileHeader}>
            <Avatar imageUrl={user?.imageUrl} name={user?.fullName} size={64} />
            <View style={styles.profileCopy}>
              <Text style={styles.name}>{user?.fullName ?? "Student"}</Text>
              <Text selectable style={styles.email}>
                {user?.primaryEmailAddress?.emailAddress ??
                  "No email available"}
              </Text>
              <View style={styles.memberPill}>
                <Text style={styles.member}>Studbady learner</Text>
              </View>
            </View>
          </View>
        </Card>
        <MenuRow
          icon={{ ios: "person.crop.circle", android: "manage_accounts" }}
          tint={palette.primary}
          title="Edit profile"
          subtitle="Name, photo, and account details"
          onPress={() => router.push("/edit-profile")}
        />
        <MenuRow
          icon={{ ios: "star.circle", android: "workspace_premium" }}
          tint={palette.accent}
          title="Premium"
          subtitle="Subscriptions and premium tools"
          onPress={() => router.push("/subscriptions")}
        />
        <Card>
          <Text style={styles.cardTitle}>About Studbady</Text>
          <Text style={ui.muted}>
            Turn your own learning material into clear summaries, flashcards,
            and focused study chats.
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
    </View>
  );
}

function MenuRow({
  icon,
  tint,
  title,
  subtitle,
  onPress,
}: {
  icon: React.ComponentProps<typeof SymbolView>["name"];
  tint: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={() => {
        hapticSelection();
        onPress();
      }}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={[styles.rowIcon, { backgroundColor: `${tint}14` }]}>
        <SymbolView name={icon} tintColor={tint} size={22} />
      </View>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <SymbolView
        name={{ ios: "chevron.right", android: "chevron_right" }}
        tintColor={palette.faint}
        size={20}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 14, paddingBottom: 32 },
  heading: { gap: 6 },
  pill: {
    alignSelf: "flex-start",
    backgroundColor: palette.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pillText: {
    color: palette.primaryDeep,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  title: {
    color: palette.ink,
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  profileCard: { overflow: "hidden" },
  profileGlow: {
    position: "absolute",
    top: -60,
    right: -60,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: palette.primarySoft,
  },
  profileHeader: { flexDirection: "row", alignItems: "center", gap: 14 },
  profileCopy: { flex: 1, gap: 3 },
  name: { color: palette.ink, fontSize: 20, fontWeight: "800" },
  email: { color: palette.muted, fontSize: 14 },
  memberPill: {
    alignSelf: "flex-start",
    marginTop: 4,
    backgroundColor: palette.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  member: { color: palette.primaryDeep, fontSize: 12, fontWeight: "700" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: radius.lg,
    padding: 14,
    ...shadow.card,
  },
  rowPressed: { transform: [{ scale: 0.99 }], backgroundColor: palette.bg },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  rowCopy: { flex: 1, gap: 2 },
  rowTitle: { color: palette.ink, fontSize: 16, fontWeight: "700" },
  rowSubtitle: { color: palette.muted, fontSize: 13, lineHeight: 18 },
  cardTitle: { color: palette.ink, fontSize: 18, fontWeight: "800" },
  version: { color: palette.faint, fontSize: 12, fontWeight: "600" },
});
