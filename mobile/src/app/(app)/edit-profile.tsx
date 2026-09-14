import { useUser } from "@clerk/expo";
import { zodResolver } from "@hookform/resolvers/zod";
import { Stack, router } from "expo-router";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { z } from "zod";

import { Button, Card, useUiStyles } from "@/components/ui";
import { useTheme } from "@/stores/theme-store";
import type { Palette } from "@/theme";

const profileSchema = z.object({
  firstName: z.string().trim().max(50, "Use 50 characters or fewer"),
  lastName: z.string().trim().max(50, "Use 50 characters or fewer"),
});
type ProfileValues = z.infer<typeof profileSchema>;

export default function EditProfile() {
  const { user } = useUser();
  const { palette } = useTheme();
  const ui = useUiStyles();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
    },
  });
  const save = async (values: ProfileValues) => {
    if (!user) return;
    setSaveError(null);
    try {
      await user.update({
        firstName: values.firstName || null,
        lastName: values.lastName || null,
      });
      router.back();
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  };
  return (
    <KeyboardAvoidingView
      style={ui.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Stack.Screen options={{ title: "Edit profile" }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>Edit your profile</Text>
        <Text style={ui.muted}>Keep your learner profile up to date.</Text>
        <Card>
          <Controller
            control={form.control}
            name="firstName"
            render={({ field, fieldState }) => (
              <Field
                label="First name"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={form.control}
            name="lastName"
            render={({ field, fieldState }) => (
              <Field
                label="Last name"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
              />
            )}
          />
          <Button
            title="Save profile"
            loading={form.formState.isSubmitting}
            onPress={form.handleSubmit(save)}
            disabled={!user}
          />
          {saveError ? (
            <Text style={styles.error} selectable>
              {saveError}
            </Text>
          ) : null}
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  error,
  ...props
}: { label: string; error?: string } & React.ComponentProps<typeof TextInput>) {
  const { palette } = useTheme();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        style={styles.input}
        placeholder={label}
        placeholderTextColor={palette.faint}
      />
      <Text style={styles.error}>{error}</Text>
    </View>
  );
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    content: { padding: 20, gap: 16 },
    title: { color: palette.ink, fontSize: 30, fontWeight: "800" },
    field: { gap: 5 },
    label: { color: palette.body, fontSize: 14, fontWeight: "700" },
    input: {
      borderWidth: 1,
      borderColor: palette.line,
      borderRadius: 14,
      minHeight: 50,
      paddingHorizontal: 14,
      color: palette.ink,
      backgroundColor: palette.inputBg,
      fontSize: 16,
    },
    error: { color: palette.danger, fontSize: 12, minHeight: 16 },
  });
