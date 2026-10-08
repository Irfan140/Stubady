import {
  GoogleSignin,
  isCancelledResponse,
  isSuccessResponse,
} from "@react-native-google-signin/google-signin";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { hapticError, hapticLight, hapticSuccess } from "@/lib/haptics";
import { authClient } from "@/lib/auth-client";
import { env } from "@/config/env";
import { useTheme } from "@/stores/theme-store";
import { radius } from "@/theme";
import type { Palette } from "@/theme";

let googleConfigured = false;

const ensureGoogleConfigured = (): boolean => {
  if (!env.googleWebClientId) return false;
  if (!googleConfigured) {
    GoogleSignin.configure({ webClientId: env.googleWebClientId });
    googleConfigured = true;
  }
  return true;
};

export function GoogleSignInButton({
  showDivider = true,
}: {
  showDivider?: boolean;
}) {
  const { palette } = useTheme();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [finishing, setFinishing] = useState(false);
  if (Platform.OS !== "ios" && Platform.OS !== "android") return null;
  const onPress = async () => {
    hapticLight();
    if (!ensureGoogleConfigured()) {
      Alert.alert(
        "Google sign-in unavailable",
        "The Google client ID is not configured in this build.",
      );
      return;
    }
    setPending(true);
    try {
      // Native account chooser; cancelled stays silent like before.
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      const response = await GoogleSignin.signIn();
      if (isCancelledResponse(response)) return;
      if (!isSuccessResponse(response) || !response.data.idToken) {
        throw new Error("Google sign-in did not return an ID token.");
      }
      const { error } = await authClient.signIn.social({
        provider: "google",
        idToken: { token: response.data.idToken },
      });
      if (error) throw error;
      setFinishing(true);
      hapticSuccess();
      router.replace("/(app)/(tabs)");
    } catch (error) {
      setFinishing(false);
      const e = error as { code?: string; message?: string };
      if (e.code !== "SIGN_IN_CANCELLED" && e.code !== "-5") {
        hapticError();
        Alert.alert("Google sign-in failed", e.message ?? "Please try again.");
      }
    } finally {
      setPending(false);
    }
  };
  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Continue with Google"
        disabled={pending}
        onPress={onPress}
        style={({ pressed }) => [
          styles.button,
          pressed && !pending && styles.pressed,
          pending && styles.disabled,
        ]}
      >
        <View style={styles.buttonContent}>
          <Image
            source={require("@/assets/images/google-logo.svg")}
            style={styles.logo}
            contentFit="contain"
          />
          {pending ? (
            <ActivityIndicator color={palette.primary} size="small" />
          ) : null}
          <Text numberOfLines={1} adjustsFontSizeToFit style={styles.text}>
            {pending ? "Connecting..." : "Continue with Google"}
          </Text>
        </View>
      </Pressable>
      {showDivider ? (
        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.or}>or continue with email</Text>
          <View style={styles.line} />
        </View>
      ) : null}
      {finishing ? (
        <View style={styles.transition}>
          <ActivityIndicator size="large" color={palette.primary} />
          <Text style={styles.transitionTitle}>
            Opening your study space...
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    wrap: { gap: 18 },
    button: {
      minHeight: 54,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: palette.line,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: palette.surface,
    },
    pressed: { transform: [{ scale: 0.98 }], borderColor: palette.primary },
    buttonContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingHorizontal: 16,
    },
    logo: { width: 20, height: 20 },
    text: {
      flexShrink: 1,
      color: palette.ink,
      fontSize: 16,
      fontWeight: "700",
      letterSpacing: -0.2,
    },
    disabled: { opacity: 0.6 },
    divider: { flexDirection: "row", alignItems: "center", gap: 12 },
    line: { height: 1, backgroundColor: palette.line, flex: 1 },
    or: {
      color: palette.faint,
      fontSize: 12,
      fontWeight: "600",
      letterSpacing: 0.2,
    },
    transition: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      backgroundColor: `${palette.bg}F5`,
    },
    transitionTitle: { color: palette.ink, fontSize: 17, fontWeight: "800" },
  });
