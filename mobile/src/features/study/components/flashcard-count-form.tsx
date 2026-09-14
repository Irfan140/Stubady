import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useMemo } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { z } from "zod";

import { Button } from "@/components/ui";
import { useTheme } from "@/stores/theme-store";
import type { Palette } from "@/theme";

const flashcardCountSchema = z.object({
  count: z
    .string()
    .regex(/^\d+$/, "Enter a whole number")
    .transform(Number)
    .pipe(
      z
        .number()
        .int()
        .min(1, "Choose at least 1 card")
        .max(20, "Choose 20 cards or fewer"),
    ),
});
type FlashcardCountValues = z.infer<typeof flashcardCountSchema>;

export function FlashcardCountForm({
  disabled,
  onSubmit,
}: {
  disabled?: boolean;
  onSubmit: (count: number) => void;
}) {
  const { palette } = useTheme();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const form = useForm<
    z.input<typeof flashcardCountSchema>,
    unknown,
    FlashcardCountValues
  >({
    resolver: zodResolver(flashcardCountSchema),
    defaultValues: { count: "12" },
    mode: "onSubmit",
  });
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        <Text style={styles.label}>Number of cards</Text>
        <View style={styles.row}>
          <Controller
            control={form.control}
            name="count"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                accessibilityLabel="Number of flashcards"
                keyboardType="number-pad"
                onBlur={onBlur}
                onChangeText={onChange}
                value={String(value ?? "")}
                style={styles.input}
              />
            )}
          />
          {!disabled ? (
            <Button
              title="Generate"
              onPress={() => {
                void form.handleSubmit((values) => onSubmit(values.count))();
              }}
            />
          ) : null}
        </View>
        {form.formState.errors.count ? (
          <Text style={styles.error}>
            {form.formState.errors.count.message}
          </Text>
        ) : (
          <Text style={styles.hint}>Choose between 1 and 20 cards.</Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    container: { gap: 8 },
    label: { color: palette.ink, fontSize: 15, fontWeight: "700" },
    row: { flexDirection: "row", alignItems: "center", gap: 10 },
    input: {
      width: 72,
      height: 48,
      borderWidth: 1,
      borderColor: palette.line,
      borderRadius: 14,
      backgroundColor: palette.surface,
      paddingHorizontal: 14,
      color: palette.ink,
      fontSize: 16,
      textAlign: "center",
    },
    hint: { color: palette.muted, fontSize: 13 },
    error: { color: palette.danger, fontSize: 13 },
  });
