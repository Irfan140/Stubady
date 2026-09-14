import { zodResolver } from "@hookform/resolvers/zod";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";
import { z } from "zod";

import {
  Button,
  Card,
  ErrorState,
  LoadingState,
  useUiStyles,
} from "@/components/ui";
import { useStudySet, useUpdateStudySet } from "@/features/study/api";
import { useTheme } from "@/stores/theme-store";
import type { Palette } from "@/theme";

const schema = z.object({
  title: z.string().trim().min(1, "Add a title").max(200),
});
type Input = z.infer<typeof schema>;

export default function EditStudySet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const current = useStudySet(id);
  const update = useUpdateStudySet(id);
  const form = useForm<Input>({
    resolver: zodResolver(schema),
    values: { title: current.data?.title ?? "" },
  });
  const { palette } = useTheme();
  const ui = useUiStyles();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  if (current.isPending) return <LoadingState />;
  if (current.isError) return <ErrorState message={current.error.message} />;
  const submit = async ({ title }: Input) => {
    try {
      await update.mutateAsync(title);
      router.back();
    } catch {
      /* mutation error is rendered below */
    }
  };
  return (
    <KeyboardAvoidingView
      style={ui.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Stack.Screen options={{ title: "Edit study set" }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={ui.content}
      >
        <Text style={styles.title}>Rename study set</Text>
        <Card>
          <Controller
            control={form.control}
            name="title"
            render={({ field, fieldState }) => (
              <>
                <TextInput
                  style={styles.input}
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                />
                <Text style={styles.error}>{fieldState.error?.message}</Text>
              </>
            )}
          />
          <Button
            title="Save changes"
            loading={update.isPending}
            onPress={form.handleSubmit(submit)}
          />
          {update.isError ? (
            <Text style={styles.error} selectable>
              {update.error.message}
            </Text>
          ) : null}
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    title: { color: palette.ink, fontSize: 28, fontWeight: "800" },
    input: {
      minHeight: 50,
      borderWidth: 1,
      borderColor: palette.line,
      borderRadius: 12,
      paddingHorizontal: 14,
      color: palette.ink,
      fontSize: 16,
    },
    error: { minHeight: 18, color: palette.danger, fontSize: 12 },
  });
