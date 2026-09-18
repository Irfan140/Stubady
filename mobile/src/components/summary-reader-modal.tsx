import { useMemo } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MarkdownText } from "@/components/markdown-text";
import { useTheme } from "@/stores/theme-store";
import { shadow, type Palette } from "@/theme";

export function getSummaryPreview(content: string) {
  return content
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/[*_`>~-]/g, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function SummaryReaderModal({
  visible,
  title,
  content,
  onClose,
}: {
  visible: boolean;
  title: string;
  content: string;
  onClose: () => void;
}) {
  const { palette } = useTheme();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close summary"
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />
        <View
          style={[
            styles.card,
            {
              marginTop: Math.max(insets.top, 18),
              marginBottom: Math.max(insets.bottom, 18),
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close summary"
              hitSlop={8}
              onPress={onClose}
              style={styles.close}
            >
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator
          >
            {content ? (
              <MarkdownText>{content}</MarkdownText>
            ) : (
              <Text style={styles.empty}>No summary content available.</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(15, 23, 42, 0.62)",
      paddingHorizontal: 16,
      justifyContent: "center",
    },
    card: {
      maxHeight: "88%",
      borderRadius: 16,
      overflow: "hidden",
      backgroundColor: palette.surface,
      ...shadow.raised,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: palette.line,
    },
    title: { flex: 1, color: palette.ink, fontSize: 19, fontWeight: "800" },
    close: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: palette.pool,
    },
    closeText: {
      color: palette.body,
      fontSize: 25,
      lineHeight: 28,
      fontWeight: "400",
    },
    content: { padding: 20, paddingBottom: 28 },
    empty: { color: palette.muted, fontSize: 15 },
  });
