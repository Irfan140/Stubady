import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

function inlineMarkdown(value: string): ReactNode[] {
  return value
    .split(/(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*]+\*|_[^_]+_)/g)
    .filter(Boolean)
    .map((part, index) => {
      if (
        (part.startsWith("**") && part.endsWith("**")) ||
        (part.startsWith("__") && part.endsWith("__"))
      )
        return (
          <Text key={index} style={styles.strong}>
            {part.slice(2, -2)}
          </Text>
        );
      if (part.startsWith("`") && part.endsWith("`"))
        return (
          <Text key={index} style={styles.code}>
            {part.slice(1, -1)}
          </Text>
        );
      if (
        (part.startsWith("*") && part.endsWith("*")) ||
        (part.startsWith("_") && part.endsWith("_"))
      )
        return (
          <Text key={index} style={styles.emphasis}>
            {part.slice(1, -1)}
          </Text>
        );
      return <Text key={index}>{part}</Text>;
    });
}

export function MarkdownText({ children }: { children: string }) {
  const lines = children.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let code: string[] | null = null;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push(
      <Text key={`p-${blocks.length}`} style={styles.paragraph} selectable>
        {inlineMarkdown(paragraph.join(" "))}
      </Text>,
    );
    paragraph = [];
  };

  lines.forEach((line, index) => {
    if (line.trim().startsWith("```")) {
      if (code) {
        blocks.push(
          <Text key={`code-${index}`} style={styles.codeBlock} selectable>
            {code.join("\n")}
          </Text>,
        );
        code = null;
      } else {
        flushParagraph();
        code = [];
      }
      return;
    }
    if (code) {
      code.push(line);
      return;
    }
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      blocks.push(
        <Text
          key={`h-${index}`}
          style={[styles.heading, heading[1].length > 1 && styles.subheading]}
          selectable
        >
          {inlineMarkdown(heading[2])}
        </Text>,
      );
      return;
    }
    const bullet = line.match(/^\s*[-*+]\s+(.+)$/);
    if (bullet) {
      flushParagraph();
      blocks.push(
        <View key={`b-${index}`} style={styles.listRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.listText} selectable>
            {inlineMarkdown(bullet[1])}
          </Text>
        </View>,
      );
      return;
    }
    const ordered = line.match(/^\s*(\d+)[.)]\s+(.+)$/);
    if (ordered) {
      flushParagraph();
      blocks.push(
        <View key={`o-${index}`} style={styles.listRow}>
          <Text style={styles.number}>{ordered[1]}.</Text>
          <Text style={styles.listText} selectable>
            {inlineMarkdown(ordered[2])}
          </Text>
        </View>,
      );
      return;
    }
    if (!line.trim()) {
      flushParagraph();
      return;
    }
    paragraph.push(line.trim());
  });

  const unfinishedCode = code as string[] | null;
  if (unfinishedCode)
    blocks.push(
      <Text key="unclosed-code" style={styles.codeBlock} selectable>
        {unfinishedCode.join("\n")}
      </Text>,
    );
  flushParagraph();
  return <View style={styles.container}>{blocks}</View>;
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  paragraph: { color: "#334155", fontSize: 16, lineHeight: 25 },
  heading: {
    color: "#0F172A",
    fontSize: 23,
    lineHeight: 30,
    fontWeight: "800",
  },
  subheading: { fontSize: 19, lineHeight: 26 },
  strong: { fontWeight: "800" },
  emphasis: { fontStyle: "italic" },
  code: {
    color: "#BE185D",
    backgroundColor: "#FCE7F3",
    fontFamily: "monospace",
  },
  codeBlock: {
    color: "#E2E8F0",
    backgroundColor: "#0F172A",
    borderRadius: 10,
    padding: 12,
    fontFamily: "monospace",
    fontSize: 13,
    lineHeight: 20,
  },
  listRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  bullet: { color: "#4F46E5", fontSize: 20, lineHeight: 25 },
  number: {
    color: "#4F46E5",
    fontSize: 15,
    lineHeight: 25,
    fontWeight: "700",
    minWidth: 22,
  },
  listText: { flex: 1, color: "#334155", fontSize: 16, lineHeight: 25 },
});
