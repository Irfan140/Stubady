import { useClerk, useUser } from "@clerk/expo";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import { Avatar, Button, Card, styles as ui } from "@/components/ui";

export default function Settings() {
  const { signOut } = useClerk();
  const { user } = useUser();
  const [signingOut, setSigningOut] = useState(false);
  const confirmSignOut = () =>
    Alert.alert("Sign out?", "You can sign back in whenever you are ready.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => {
          setSigningOut(true);
          void signOut().catch(() => setSigningOut(false));
        },
      },
    ]);
  return (
    <View style={ui.screen}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
      >
        <View style={styles.heading}>
          <Text style={styles.eyebrow}>ACCOUNT</Text>
          <Text style={styles.title}>Settings</Text>
          <Text style={ui.muted}>
            Manage your profile and study experience.
          </Text>
        </View>
        <Card>
          <View style={styles.profileHeader}>
            <Avatar imageUrl={user?.imageUrl} name={user?.fullName} size={64} />
            <View style={styles.profileCopy}>
              <Text style={styles.name}>{user?.fullName ?? "Student"}</Text>
              <Text selectable style={styles.email}>
                {user?.primaryEmailAddress?.emailAddress ??
                  "No email available"}
              </Text>
              <Text style={styles.member}>Studbady learner</Text>
            </View>
          </View>
        </Card>
        <Card>
          <Text style={styles.cardTitle}>Account</Text>
          <Button
            title="Edit profile"
            variant="secondary"
            onPress={() => router.push("/edit-profile")}
          />
        </Card>
        <Card>
          <Text style={styles.cardTitle}>Study experience</Text>
          <Text style={styles.settingTitle}>Premium</Text>
          <Text style={styles.settingSubtitle}>
            Subscriptions and premium tools will appear here.
          </Text>
          <Button
            title="View plans"
            variant="secondary"
            onPress={() => router.push("/subscriptions")}
          />
        </Card>
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

const styles = StyleSheet.create({
  content: { padding: 20, gap: 16, paddingBottom: 32 },
  heading: { gap: 6 },
  eyebrow: {
    color: "#2563EB",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.6,
  },
  title: {
    color: "#0F172A",
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  profileHeader: { flexDirection: "row", alignItems: "center", gap: 14 },
  profileCopy: { flex: 1, gap: 3 },
  name: { color: "#0F172A", fontSize: 20, fontWeight: "800" },
  email: { color: "#475569", fontSize: 14 },
  member: { color: "#2563EB", fontSize: 12, fontWeight: "700" },
  cardTitle: { color: "#0F172A", fontSize: 18, fontWeight: "800" },
  settingTitle: { color: "#0F172A", fontSize: 15, fontWeight: "700" },
  settingSubtitle: { color: "#64748B", fontSize: 13, lineHeight: 19 },
  version: { color: "#94A3B8", fontSize: 12, fontWeight: "600" },
});
