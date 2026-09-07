import { zodResolver } from "@hookform/resolvers/zod";
import { Stack, router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";

import { Button, Card, TextField, styles as ui } from "@/components/ui";
import { useCreateStudySet } from "@/features/study/api";

const schema = z.object({
  title: z.string().trim().min(1, "Add a title").max(200),
});
type Input = z.infer<typeof schema>;

export default function NewStudySet() {
  const insets = useSafeAreaInsets();
  const create = useCreateStudySet();
  const form = useForm<Input>({
    resolver: zodResolver(schema),
    defaultValues: { title: "" },
  });
  const submit = async ({ title }: Input) => {
    try {
      const result = await create.mutateAsync(title);
      router.replace({
        pathname: "/study-set/[id]",
        params: { id: result.id },
      });
    } catch {
      /* mutation error is rendered below */
    }
  };
  return (
    <KeyboardAvoidingView
      style={ui.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          ui.content,
          {
            paddingTop: Math.max(insets.top, 12) + 4,
            paddingBottom: Math.max(insets.bottom, 16) + 24,
          },
        ]}
      >
        <View style={styles.navBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={12}
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <SymbolView
              name={{ ios: "chevron.left", android: "arrow_back" }}
              tintColor="#0F172A"
              size={22}
            />
          </Pressable>
          <Text numberOfLines={1} style={styles.navTitle}>
            New study set
          </Text>
          <View style={styles.navSpacer} />
        </View>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>NEW SET</Text>
          <Text style={styles.title}>What are you learning?</Text>
          <Text style={ui.muted}>
            Give this collection a clear name so it is easy to find later.
          </Text>
        </View>
        <Card>
          <Controller
            control={form.control}
            name="title"
            render={({ field, fieldState }) => (
              <TextField
                label="Title"
                autoFocus
                placeholder="e.g. Biology — Cell structure"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                returnKeyType="done"
                onSubmitEditing={() => {
                  void form.handleSubmit(submit)();
                }}
                error={fieldState.error?.message}
                editable={!create.isPending}
              />
            )}
          />
          <Button
            title="Create study set"
            loading={create.isPending}
            onPress={() => {
              void form.handleSubmit(submit)();
            }}
          />
          {create.isError ? (
            <Text style={styles.error} selectable>
              {create.error.message}
            </Text>
          ) : null}
        </Card>
      </ScrollView>
      {create.isPending ? (
        <View style={styles.overlay}>
          <View style={styles.overlayCard}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.overlayTitle}>Creating your study set…</Text>
            <Text style={styles.overlaySubtitle}>
              Setting up your revision space.
            </Text>
          </View>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  navBar: { flexDirection: "row", alignItems: "center", gap: 8 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6EAF2",
  },
  navTitle: { flex: 1, color: "#0F172A", fontSize: 17, fontWeight: "700" },
  navSpacer: { width: 40 },
  hero: { gap: 6 },
  eyebrow: {
    color: "#4F46E5",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.3,
  },
  title: { color: "#0F172A", fontSize: 28, fontWeight: "800" },
  error: { minHeight: 18, color: "#B91C1C", fontSize: 13 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.42)",
    padding: 24,
  },
  overlayCard: {
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  overlayTitle: { color: "#0F172A", fontSize: 17, fontWeight: "800" },
  overlaySubtitle: { color: "#64748B", fontSize: 14, textAlign: "center" },
  pressed: { opacity: 0.85 },
});
