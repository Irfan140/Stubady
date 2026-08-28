import type { ReactNode } from "react";
import { Image as ExpoImage } from "expo-image";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color="#2563EB" />
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.center}>
      <Text style={styles.error}>{message}</Text>
      {onRetry ? (
        <Button title="Try again" onPress={onRetry} variant="secondary" />
      ) : null}
    </View>
  );
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.muted}>{message}</Text>
      {action}
    </View>
  );
}

export function Button({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary",
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger";
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === "secondary" && styles.secondaryButton,
        variant === "danger" && styles.dangerButton,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && !loading && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? "#FFFFFF" : "#0F172A"}
        />
      ) : (
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          style={[
            styles.buttonText,
            variant !== "primary" && styles.secondaryText,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function Avatar({
  imageUrl,
  name,
  size = 56,
}: {
  imageUrl?: string | null;
  name?: string | null;
  size?: number;
}) {
  const initials = (name ?? "Student")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return imageUrl ? (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <View
        style={[
          styles.avatarImage,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      >
        <ExpoImage
          source={{ uri: imageUrl }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      </View>
    </View>
  ) : (
    <View
      style={[
        styles.avatar,
        styles.avatarFallback,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.avatarText, { fontSize: size * 0.34 }]}>
        {initials || "S"}
      </Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { padding: 20, gap: 16 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  muted: {
    color: "#64748B",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  error: {
    color: "#B91C1C",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  empty: { alignItems: "center", gap: 10, paddingVertical: 44 },
  emptyTitle: { color: "#0F172A", fontSize: 20, fontWeight: "700" },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
  },
  avatar: { overflow: "hidden", backgroundColor: "#DBEAFE" },
  avatarImage: { overflow: "hidden" },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#1D4ED8", fontWeight: "800" },
  button: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    backgroundColor: "#2563EB",
  },
  secondaryButton: { backgroundColor: "#E2E8F0" },
  dangerButton: { backgroundColor: "#FEE2E2" },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.84, transform: [{ scale: 0.985 }] },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    flexShrink: 1,
  },
  secondaryText: { color: "#0F172A" },
});
