import { useSignInWithGoogle } from "@clerk/expo/google";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export function GoogleSignInButton({
  showDivider = true,
}: {
  showDivider?: boolean;
}) {
  const { startGoogleAuthenticationFlow } = useSignInWithGoogle();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [finishing, setFinishing] = useState(false);
  if (Platform.OS !== "ios" && Platform.OS !== "android") return null;
  const onPress = async () => {
    setPending(true);
    try {
      const { createdSessionId, setActive } =
        await startGoogleAuthenticationFlow();
      if (createdSessionId && setActive) {
        setFinishing(true);
        await setActive({ session: createdSessionId });
        router.replace("/(app)/(tabs)");
      }
    } catch (error) {
      setFinishing(false);
      const e = error as { code?: string; message?: string };
      if (e.code !== "SIGN_IN_CANCELLED" && e.code !== "-5")
        Alert.alert("Google sign-in failed", e.message ?? "Please try again.");
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
        style={[styles.button, pending && styles.disabled]}
      >
        <View style={styles.buttonContent}>
          <Image
            source={require("@/assets/images/google-logo.svg")}
            style={styles.logo}
            contentFit="contain"
          />
          {pending ? <ActivityIndicator color="#4285F4" size="small" /> : null}
          <Text numberOfLines={1} adjustsFontSizeToFit style={styles.text}>
            {pending ? "Connecting..." : "Continue with Google"}
          </Text>
        </View>
      </Pressable>
      {showDivider ? (
        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.or}>OR</Text>
          <View style={styles.line} />
        </View>
      ) : null}
      {finishing ? (
        <View style={styles.transition}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.transitionTitle}>
            Opening your study space...
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  button: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 16,
  },
  logo: { width: 20, height: 20 },
  text: { flexShrink: 1, color: "#0F172A", fontSize: 16, fontWeight: "700" },
  disabled: { opacity: 0.55 },
  divider: { flexDirection: "row", alignItems: "center", gap: 10 },
  line: { height: 1, backgroundColor: "#E2E8F0", flex: 1 },
  or: { color: "#94A3B8", fontSize: 12, fontWeight: "700" },
  transition: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "rgba(248, 250, 252, 0.96)",
  },
  transitionTitle: { color: "#0F172A", fontSize: 18, fontWeight: "800" },
});
