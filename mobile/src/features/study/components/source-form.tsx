import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { z } from "zod";

import { Button, Segmented, TextField, useUiStyles } from "@/components/ui";

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
  const ui = useUiStyles();
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
    <View style={styles.container}>
      <Segmented
        ariaLabel="Source kind"
        value={type}
        onChange={(next) => {
          setType(next);
          form.reset(
            next === "note"
              ? { type: "note", content: "" }
              : { type: "web", url: "" },
          );
        }}
        options={[
          { value: "note", label: "Note" },
          { value: "web", label: "Web page" },
        ]}
      />
      {type === "note" ? (
        <Controller
          control={form.control}
          name="content"
          render={({ field, fieldState }) => (
            <TextField
              label="Your notes"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              placeholder="Paste your notes here"
              value={field.value ?? ""}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              editable={!mutation.isPending}
            />
          )}
        />
      ) : (
        <Controller
          control={form.control}
          name="url"
          render={({ field, fieldState }) => (
            <TextField
              label="Page URL"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              placeholder="https://example.com/article"
              value={field.value ?? ""}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              editable={!mutation.isPending}
            />
          )}
        />
      )}
      <Button
        title={
          mutation.isPending
            ? "Adding…"
            : `Add ${type === "note" ? "note" : "web page"}`
        }
        loading={mutation.isPending}
        onPress={form.handleSubmit(submit)}
      />
      {mutation.error ? (
        <Text style={ui.error}>{mutation.error.message}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
});
