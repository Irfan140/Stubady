import { useUser } from "@clerk/expo";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";

import {
  Button,
  Card,
  Screen,
  TextField,
  TopBar,
  useUiStyles,
} from "@/components/ui";
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
  const insets = useSafeAreaInsets();
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
    <Screen>
      <KeyboardAvoidingView
        style={ui.screen}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            ui.content,
            { paddingTop: Math.max(insets.top, 12) + 4 },
          ]}
        >
          <TopBar title="Edit profile" />
          <Text style={styles.lede}>Keep your learner profile up to date.</Text>
          <Card>
            <Controller
              control={form.control}
              name="firstName"
              render={({ field, fieldState }) => (
                <TextField
                  label="First name"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                  editable={Boolean(user)}
                />
              )}
            />
            <Controller
              control={form.control}
              name="lastName"
              render={({ field, fieldState }) => (
                <TextField
                  label="Last name"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                  editable={Boolean(user)}
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
    </Screen>
  );
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    lede: { color: palette.muted, fontSize: 15, lineHeight: 21 },
    error: { color: palette.danger, fontSize: 12, minHeight: 16 },
  });
