import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";

import { Button, Card, TextField, TopBar, useUiStyles } from "@/components/ui";
import { useCreateStudySet } from "@/features/study/api";
import { useTheme } from "@/stores/theme-store";
import type { Palette } from "@/theme";

const schema = z.object({
  title: z.string().trim().min(1, "Add a title").max(200),
});
type Input = z.infer<typeof schema>;

export default function NewStudySet() {
  const { palette } = useTheme();
  const ui = useUiStyles();
  const styles = useMemo(() => makeStyles(palette), [palette]);
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
        pathname: "/(app)/study-set/[id]",
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
        <TopBar title="New study set" />
        <View style={styles.hero}>
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
            <ActivityIndicator size="large" color={palette.primary} />
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
const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    hero: { gap: 6 },
    title: { color: palette.ink, fontSize: 28, fontWeight: "800" },
    error: { minHeight: 18, color: palette.danger, fontSize: 13 },
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
      backgroundColor: palette.surface,
      borderRadius: 16,
      paddingHorizontal: 24,
      paddingVertical: 28,
    },
    overlayTitle: { color: palette.ink, fontSize: 17, fontWeight: "800" },
    overlaySubtitle: {
      color: palette.muted,
      fontSize: 14,
      textAlign: "center",
    },
  });
