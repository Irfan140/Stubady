import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
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

const styles = StyleSheet.create({
  container: { gap: 8 },
  label: { color: "#0F172A", fontSize: 15, fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  input: {
    width: 72,
    height: 48,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    color: "#0F172A",
    fontSize: 16,
    textAlign: "center",
  },
  hint: { color: "#64748B", fontSize: 13 },
  error: { color: "#B91C1C", fontSize: 13 },
});
