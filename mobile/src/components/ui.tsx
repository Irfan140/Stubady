import type { ReactNode } from "react";
import { useState } from "react";
import { Image as ExpoImage } from "expo-image";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { hapticLight } from "@/lib/haptics";
import { palette, radius, shadow, type } from "@/theme";

export function Screen({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.screen, style]}>
      <StatusBar style="dark" />
      {children}
    </View>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <View style={[styles.screen, styles.center]}>
      <StatusBar style="dark" />
      <ActivityIndicator color={palette.primary} size="large" />
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
    <View style={[styles.screen, styles.center]}>
      <StatusBar style="dark" />
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
  icon,
}: {
  title: string;
  message: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <View style={styles.empty}>
      {icon ? <View style={styles.emptyIcon}>{icon}</View> : null}
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.muted}>{message}</Text>
      {action ? <View style={styles.emptyAction}>{action}</View> : null}
    </View>
  );
}

export function Button({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary",
  icon,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger";
  icon?: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled || loading}
      onPress={() => {
        hapticLight();
        onPress();
      }}
      style={({ pressed }) => [
        styles.button,
        variant === "secondary" && styles.secondaryButton,
        variant === "danger" && styles.dangerButton,
        variant === "primary" && pressed && !disabled && !loading
          ? styles.primaryPressed
          : null,
        variant !== "primary" && pressed && !disabled && !loading
          ? styles.ghostPressed
          : null,
        (disabled || loading) && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? "#FFFFFF" : palette.ink}
        />
      ) : (
        <View style={styles.buttonRow}>
          {icon}
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
            style={[
              styles.buttonText,
              variant === "secondary" && styles.secondaryText,
              variant === "danger" && styles.dangerText,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function TextField({
  label,
  error,
  ...props
}: { label: string; error?: string } & React.ComponentProps<typeof TextInput>) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        style={[styles.input, focused && styles.inputFocused]}
        placeholder={props.placeholder ?? label}
        placeholderTextColor={palette.faint}
        onFocus={(event) => {
          setFocused(true);
          props.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          props.onBlur?.(event);
        }}
      />
      <Text style={styles.fieldError}>{error}</Text>
    </View>
  );
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
  screen: { flex: 1, backgroundColor: palette.bg },
  content: { padding: 20, gap: 16 },
  center: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  muted: {
    color: palette.muted,
    fontSize: type.body.fontSize,
    lineHeight: type.body.lineHeight,
    textAlign: "center",
  },
  error: {
    color: palette.danger,
    fontSize: type.body.fontSize,
    lineHeight: type.body.lineHeight,
    textAlign: "center",
  },
  empty: { alignItems: "center", gap: 10, paddingVertical: 44 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: palette.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  emptyTitle: {
    color: palette.ink,
    fontSize: type.h2.fontSize,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyAction: { marginTop: 8 },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.xl,
    padding: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: palette.line,
    ...shadow.card,
  },
  avatar: {
    overflow: "hidden",
    backgroundColor: palette.primarySoft,
    borderWidth: 1,
    borderColor: palette.line,
  },
  avatarImage: { overflow: "hidden" },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  avatarText: { color: palette.primaryDeep, fontWeight: "800" },
  button: {
    minHeight: 52,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    backgroundColor: palette.primary,
    ...shadow.raised,
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.line,
    boxShadow: "none",
  },
  dangerButton: {
    backgroundColor: palette.dangerSoft,
    borderWidth: 1,
    borderColor: "#FECACA",
    boxShadow: "none",
  },
  primaryPressed: {
    backgroundColor: palette.primaryDeep,
    transform: [{ scale: 0.97 }],
  },
  ghostPressed: { backgroundColor: palette.bg, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.5 },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
    textAlign: "center",
    flexShrink: 1,
  },
  secondaryText: { color: palette.ink },
  dangerText: { color: palette.danger },
  field: { gap: 6 },
  label: { color: palette.body, fontSize: 13, fontWeight: "700" },
  input: {
    borderWidth: 1.5,
    borderColor: palette.line,
    borderRadius: radius.md,
    minHeight: 52,
    paddingHorizontal: 14,
    color: palette.ink,
    fontSize: 16,
    backgroundColor: "#FAFBFE",
  },
  inputFocused: { borderColor: palette.primary, backgroundColor: "#FFFFFF" },
  fieldError: { minHeight: 18, color: palette.danger, fontSize: 12 },
});
