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
            <View style={styles.heading}>
              <Text style={styles.eyebrow}>STUDY SUMMARY</Text>
              <Text style={styles.title}>{title}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close summary"
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

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.62)",
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  card: {
    maxHeight: "88%",
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.22)",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  heading: { flex: 1, gap: 4 },
  eyebrow: {
    color: "#2563EB",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.3,
  },
  title: { color: "#0F172A", fontSize: 21, fontWeight: "800" },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
  },
  closeText: {
    color: "#334155",
    fontSize: 25,
    lineHeight: 28,
    fontWeight: "400",
  },
  content: { padding: 20, paddingBottom: 28 },
  empty: { color: "#64748B", fontSize: 15 },
});
