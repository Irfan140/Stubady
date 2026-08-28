import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { z } from "zod";

import { Button, Card } from "@/components/ui";

const schema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("note"),
    content: z.string().trim().min(1, "Paste some notes"),
  }),
  z.object({ type: z.literal("web"), url: z.url("Enter a valid URL") }),
]);
type Input = z.infer<typeof schema>;

export function SourceForm({
  studySetId,
  mutation,
  onDone,
  initialType = "note",
}: {
  studySetId: string;
  mutation: {
    mutateAsync: (input: Input & { studySetId: string }) => Promise<unknown>;
    isPending: boolean;
    error: Error | null;
  };
  onDone: () => void;
  initialType?: Input["type"];
}) {
  const [type, setType] = useState<Input["type"]>(initialType);
  const form = useForm<Input>({
    resolver: zodResolver(schema),
    defaultValues:
      initialType === "note"
        ? { type: "note", content: "" }
        : { type: "web", url: "" },
  });
  const submit = async (input: Input) => {
    try {
      await mutation.mutateAsync({ ...input, studySetId });
      form.reset({ type: "note", content: "" });
      onDone();
    } catch {
      /* mutation error is rendered below */
    }
  };
  return (
    <Card>
      <Text style={styles.label}>Add a note or web page</Text>
      <View style={styles.switcher}>
        <Button
          title="Note"
          variant={type === "note" ? "primary" : "secondary"}
          onPress={() => {
            setType("note");
            form.reset({ type: "note", content: "" });
          }}
        />
        <Button
          title="Web page"
          variant={type === "web" ? "primary" : "secondary"}
          onPress={() => {
            setType("web");
            form.reset({ type: "web", url: "" });
          }}
        />
      </View>
      {type === "note" ? (
        <Controller
          control={form.control}
          name="content"
          render={({ field, fieldState }) => (
            <>
              <TextInput
                multiline
                numberOfLines={4}
                style={styles.input}
                placeholder="Paste your notes here"
                value={field.value ?? ""}
                onChangeText={field.onChange}
              />
              <Text style={styles.error}>{fieldState.error?.message}</Text>
            </>
          )}
        />
      ) : (
        <Controller
          control={form.control}
          name="url"
          render={({ field, fieldState }) => (
            <>
              <TextInput
                autoCapitalize="none"
                keyboardType="url"
                style={styles.input}
                placeholder="https://example.com/article"
                value={field.value ?? ""}
                onChangeText={field.onChange}
              />
              <Text style={styles.error}>{fieldState.error?.message}</Text>
            </>
          )}
        />
      )}
      <Button
        title={
          mutation.isPending
            ? "Adding…"
            : `Add ${type === "note" ? "note" : "web page"}`
        }
        onPress={form.handleSubmit(submit)}
        disabled={mutation.isPending}
      />
      {mutation.error ? (
        <Text style={styles.error}>{mutation.error.message}</Text>
      ) : null}
    </Card>
  );
}
const styles = StyleSheet.create({
  label: { color: "#0F172A", fontWeight: "700" },
  switcher: { flexDirection: "row", gap: 8 },
  input: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    padding: 12,
    textAlignVertical: "top",
    color: "#0F172A",
  },
  error: { minHeight: 18, color: "#B91C1C", fontSize: 12 },
});
