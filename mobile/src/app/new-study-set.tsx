import { zodResolver } from "@hookform/resolvers/zod";
import { Stack, router } from "expo-router";
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

import { Button, Card, styles as ui } from "@/components/ui";
import { useCreateStudySet } from "@/features/study/api";

const schema = z.object({
  title: z.string().trim().min(1, "Add a title").max(200),
});
type Input = z.infer<typeof schema>;

export default function NewStudySet() {
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
      <Stack.Screen options={{ title: "New study set" }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={ui.content}
      >
        <Text style={styles.title}>What are you learning?</Text>
        <Text style={ui.muted}>
          Give this collection a clear name so it is easy to find later.
        </Text>
        <Card>
          <Controller
            control={form.control}
            name="title"
            render={({ field, fieldState }) => (
              <>
                <TextInput
                  autoFocus
                  style={styles.input}
                  placeholder="e.g. Biology — Cell structure"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                />
                <Text style={styles.error}>{fieldState.error?.message}</Text>
              </>
            )}
          />
          <Button
            title={create.isPending ? "Creating…" : "Create study set"}
            onPress={form.handleSubmit(submit)}
            disabled={create.isPending}
          />
          {create.isError ? (
            <Text style={styles.error} selectable>
              {create.error.message}
            </Text>
          ) : null}
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  title: { color: "#0F172A", fontSize: 28, fontWeight: "800" },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: "#0F172A",
  },
  error: { minHeight: 18, color: "#B91C1C", fontSize: 13 },
});
