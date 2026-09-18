import type { ReactNode } from "react";
import { useMemo } from "react";
import { Image as ExpoImage } from "expo-image";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SymbolView } from "expo-symbols";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { hapticLight, hapticSelection } from "@/lib/haptics";
import { useTheme } from "@/stores/theme-store";
import { radius, shadow, type, type Palette } from "@/theme";

export function Screen({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { isDark } = useTheme();
  const ui = useUiStyles();
  return (
    <View style={[ui.screen, style]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      {children}
    </View>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  const { isDark, palette } = useTheme();
  const ui = useUiStyles();
  return (
    <View style={[ui.screen, ui.center]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <ActivityIndicator color={palette.primary} size="large" />
      <Text style={ui.muted}>{label}</Text>
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
  const { isDark, palette } = useTheme();
  const ui = useUiStyles();
  return (
    <View style={[ui.screen, ui.center]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <SymbolView
        name={{ ios: "exclamationmark.triangle", android: "warning" }}
        tintColor={palette.danger}
        size={32}
      />
      <Text style={ui.error}>{message}</Text>
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
  const ui = useUiStyles();
  return (
    <View style={ui.empty}>
      {icon ? <View style={ui.emptyIcon}>{icon}</View> : null}
      <Text style={ui.emptyTitle}>{title}</Text>
      <Text style={ui.emptyMessage}>{message}</Text>
      {action ? <View style={ui.emptyAction}>{action}</View> : null}
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
  const { palette } = useTheme();
  const styles = useUiStyles();
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
        pressed && !disabled && !loading && styles.buttonPressed,
        (disabled || loading) && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? palette.primaryInk : palette.ink}
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
  const ui = useUiStyles();
  return <View style={[ui.card, style]}>{children}</View>;
}

/** Small pill for counts, types, and citation chips. */
export function Chip({ label }: { label: string }) {
  const ui = useUiStyles();
  return (
    <View style={ui.chip}>
      <Text numberOfLines={1} style={ui.chipText}>
        {label}
      </Text>
    </View>
  );
}

export function TextField({
  label,
  error,
  ...props
}: { label: string; error?: string } & React.ComponentProps<typeof TextInput>) {
  const { palette } = useTheme();
  const styles = useUiStyles();
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        style={styles.input}
        placeholder={props.placeholder ?? label}
        placeholderTextColor={palette.faint}
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
  const styles = useUiStyles();
  const initials = (name ?? "Student")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const round = { width: size, height: size, borderRadius: size / 2 };
  return imageUrl ? (
    <View style={[styles.avatar, round]}>
      <ExpoImage source={{ uri: imageUrl }} style={round} />
    </View>
  ) : (
    <View style={[styles.avatar, styles.avatarFallback, round]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.34 }]}>
        {initials || "S"}
      </Text>
    </View>
  );
}

/**
 * Consistent pushed-screen header. The Stack gesture stays alive underneath;
 * this bar only gives every screen the same title row and back target size.
 */
export function TopBar({
  title,
  action,
  onBack,
}: {
  title: string;
  action?: ReactNode;
  onBack?: () => void;
}) {
  const { palette } = useTheme();
  const styles = useUiStyles();
  return (
    <View style={styles.topBar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={8}
        onPress={() => {
          hapticSelection();
          if (onBack) onBack();
          else router.back();
        }}
        style={({ pressed }) => [
          styles.topBarButton,
          pressed && styles.topBarButtonPressed,
        ]}
      >
        <SymbolView
          name={{ ios: "chevron.left", android: "arrow_back" }}
          tintColor={palette.ink}
          size={22}
        />
      </Pressable>
      <Text numberOfLines={1} style={styles.topBarTitle}>
        {title}
      </Text>
      <View style={styles.topBarAction}>{action}</View>
    </View>
  );
}

/** Hub segments and any small tab set. Active option is drawn heavier. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  const styles = useUiStyles();
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={ariaLabel}
      style={styles.segmented}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            onPress={() => {
              if (!selected) {
                hapticSelection();
                onChange(option.value);
              }
            }}
            style={({ pressed }) => [
              styles.segment,
              selected && styles.segmentSelected,
              pressed && !selected && styles.segmentPressed,
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                selected && styles.segmentTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Hairline readiness band. Status reads as a band, never a filled pill. */
export function ProgressLine({
  ready,
  total,
  caption,
}: {
  ready: number;
  total: number;
  caption: string;
}) {
  const { palette } = useTheme();
  const styles = useUiStyles();
  const ratio = total > 0 ? Math.min(1, ready / total) : 0;
  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.round(ratio * 100)}%`,
              backgroundColor:
                total > 0 && ready < total ? palette.warning : palette.success,
            },
          ]}
        />
      </View>
      <Text style={styles.progressCaption}>{caption}</Text>
    </View>
  );
}

/**
 * Unified bottom sheet: the room darkens, one lit panel rises. Single home
 * for intake, rename, and overflow menus — replaces the stacked ad-hoc
 * modals of the old UI.
 */
export function Sheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const { palette } = useTheme();
  const styles = useUiStyles();
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.sheetBackdrop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Close ${title}`}
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />
        <KeyboardAvoidingView behavior="padding" style={styles.sheetKeyboard}>
          <View
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, 20) },
            ]}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{title}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Close ${title}`}
                hitSlop={8}
                onPress={onClose}
                style={({ pressed }) => [
                  styles.sheetClose,
                  pressed && styles.sheetClosePressed,
                ]}
              >
                <SymbolView
                  name={{ ios: "xmark", android: "close" }}
                  tintColor={palette.body}
                  size={18}
                />
              </Pressable>
            </View>
            {children}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

/**
 * Theme-aware shared styles. Colors resolve from the Zustand theme store, so
 * every consumer re-renders with the active palette (light/dark) without
 * prop drilling. Shape/type tokens stay static in `@/theme`.
 */
export function useUiStyles() {
  const { palette } = useTheme();
  return useMemo(() => createUiStyles(palette), [palette]);
}

const createUiStyles = (palette: Palette) =>
  StyleSheet.create({
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
      backgroundColor: palette.pool,
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
    emptyMessage: {
      color: palette.muted,
      fontSize: type.body.fontSize,
      lineHeight: type.body.lineHeight,
      textAlign: "center",
      paddingHorizontal: 16,
    },
    emptyAction: { marginTop: 8 },
    card: {
      backgroundColor: palette.surface,
      borderRadius: radius.lg,
      padding: 16,
      gap: 10,
      borderWidth: 1,
      borderColor: palette.line,
    },
    chip: {
      backgroundColor: palette.primarySoft,
      borderRadius: radius.pill,
      paddingHorizontal: 10,
      paddingVertical: 4,
      alignSelf: "flex-start",
    },
    chipText: {
      color: palette.primary,
      fontSize: 12,
      fontWeight: "800",
    },
    avatar: {
      overflow: "hidden",
      backgroundColor: palette.pool,
      borderWidth: 1,
      borderColor: palette.line,
    },
    avatarFallback: { alignItems: "center", justifyContent: "center" },
    avatarText: { color: palette.primary, fontWeight: "800" },
    button: {
      minHeight: 52,
      borderRadius: radius.md,
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
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: palette.line,
      boxShadow: "none",
    },
    dangerButton: {
      backgroundColor: palette.dangerSoft,
      borderWidth: 1,
      borderColor: palette.dangerBorder,
      boxShadow: "none",
    },
    buttonPressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
    disabled: { opacity: 0.5 },
    buttonText: {
      color: palette.primaryInk,
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
      borderWidth: 1,
      borderColor: palette.line,
      borderRadius: radius.md,
      minHeight: 52,
      paddingHorizontal: 14,
      color: palette.ink,
      fontSize: 16,
      backgroundColor: palette.inputBg,
    },
    fieldError: { minHeight: 18, color: palette.danger, fontSize: 12 },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      minHeight: 48,
    },
    topBarButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.line,
    },
    topBarButtonPressed: { opacity: 0.7, transform: [{ scale: 0.94 }] },
    topBarTitle: {
      flex: 1,
      color: palette.ink,
      fontSize: 17,
      fontWeight: "700",
      textAlign: "center",
    },
    topBarAction: {
      width: 44,
      alignItems: "flex-end",
      justifyContent: "center",
    },
    segmented: {
      flexDirection: "row",
      gap: 4,
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.line,
      borderRadius: radius.lg,
      padding: 4,
    },
    segment: {
      flex: 1,
      minHeight: 44,
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 6,
    },
    segmentSelected: { backgroundColor: palette.primarySoft },
    segmentPressed: { backgroundColor: palette.pool },
    segmentText: { color: palette.muted, fontSize: 13, fontWeight: "600" },
    segmentTextSelected: { color: palette.primary, fontWeight: "800" },
    progressWrap: { gap: 6 },
    progressTrack: {
      height: 4,
      borderRadius: 2,
      backgroundColor: palette.line,
      overflow: "hidden",
    },
    progressFill: { height: 4, borderRadius: 2 },
    progressCaption: { color: palette.muted, fontSize: 13, lineHeight: 18 },
    sheetBackdrop: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(4, 6, 14, 0.6)",
    },
    sheetKeyboard: { justifyContent: "flex-end" },
    sheet: {
      gap: 12,
      paddingHorizontal: 20,
      paddingTop: 8,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      backgroundColor: palette.surface,
      ...shadow.raised,
    },
    sheetHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: palette.line,
      alignSelf: "center",
    },
    sheetHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    sheetTitle: {
      flex: 1,
      color: palette.ink,
      fontSize: 19,
      fontWeight: "800",
    },
    sheetClose: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: palette.pool,
    },
    sheetClosePressed: { opacity: 0.7 },
  });
