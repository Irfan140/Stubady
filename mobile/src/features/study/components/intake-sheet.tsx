import { SymbolView } from "expo-symbols";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Sheet } from "@/components/ui";
import { useTheme } from "@/stores/theme-store";
import { radius, type Palette } from "@/theme";
import { PdfSourceForm } from "./pdf-source-form";
import { SourceForm } from "./source-form";

type Mode = "pick" | "pdf" | "note" | "web";

type Mutation = {
  mutateAsync: (
    input:
      | { type: "note"; studySetId: string; content: string }
      | { type: "web"; studySetId: string; url: string },
  ) => Promise<unknown>;
  isPending: boolean;
  error: Error | null;
};

/**
 * One intake sheet for every source kind. PDF keeps its upload state
 * machine; notes and web share one form — the old three-modal maze folds
 * into a single lit panel.
 */
export function IntakeSheet({
  visible,
  onClose,
  studySetId,
  mutation,
}: {
  visible: boolean;
  onClose: () => void;
  studySetId: string;
  mutation: Mutation;
}) {
  const { palette } = useTheme();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const [mode, setMode] = useState<Mode>("pick");
  const close = () => {
    setMode("pick");
    onClose();
  };
  return (
    <Sheet
      visible={visible}
      onClose={close}
      title={
        mode === "pick"
          ? "Add source"
          : mode === "pdf"
            ? "Upload PDF"
            : mode === "note"
              ? "Add a note"
              : "Add a web page"
      }
    >
      {mode === "pick" ? (
        <View style={styles.options}>
          <IntakeOption
            icon={{ ios: "doc.fill", android: "picture_as_pdf" }}
            title="PDF document"
            body="Readings and slides, up to 25 MB"
            onPress={() => setMode("pdf")}
          />
          <IntakeOption
            icon={{ ios: "note.text", android: "edit_note" }}
            title="Note"
            body="Paste or type directly"
            onPress={() => setMode("note")}
          />
          <IntakeOption
            icon={{ ios: "link", android: "link" }}
            title="Web page"
            body="Drop in a link"
            onPress={() => setMode("web")}
          />
        </View>
      ) : mode === "pdf" ? (
        <PdfSourceForm
          studySetId={studySetId}
          autoOpen
          onDone={close}
          onClose={() => setMode("pick")}
        />
      ) : (
        <SourceForm
          studySetId={studySetId}
          initialType={mode}
          mutation={mutation}
          onDone={close}
        />
      )}
    </Sheet>
  );
}

function IntakeOption({
  icon,
  title,
  body,
  onPress,
}: {
  icon: React.ComponentProps<typeof SymbolView>["name"];
  title: string;
  body: string;
  onPress: () => void;
}) {
  const { palette } = useTheme();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [styles.option, pressed && styles.pressed]}
    >
      <View style={styles.optionIcon}>
        <SymbolView name={icon} tintColor={palette.primary} size={22} />
      </View>
      <View style={styles.optionCopy}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionBody}>{body}</Text>
      </View>
      <SymbolView
        name={{ ios: "chevron.right", android: "chevron_right" }}
        tintColor={palette.faint}
        size={20}
      />
    </Pressable>
  );
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    options: { gap: 8 },
    option: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      minHeight: 64,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: radius.md,
      backgroundColor: palette.pool,
    },
    pressed: { opacity: 0.7 },
    optionIcon: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.line,
      alignItems: "center",
      justifyContent: "center",
    },
    optionCopy: { flex: 1, gap: 2 },
    optionTitle: { color: palette.ink, fontSize: 16, fontWeight: "800" },
    optionBody: { color: palette.muted, fontSize: 13, lineHeight: 18 },
  });
