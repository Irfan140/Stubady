import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import {
  onlineManager,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import NetInfo from "@react-native-community/netinfo";

import "expo-insights";
import * as Updates from "expo-updates";

import { env } from "@/config/env";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
    mutations: { retry: 0 },
  },
});

onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => setOnline(Boolean(state.isConnected))),
);

export default function RootLayout() {
  return (
    <ClerkProvider
      publishableKey={env.clerkPublishableKey}
      tokenCache={tokenCache}
    >
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <RootNavigator />
          <UpdateBanner />
        </SafeAreaProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function UpdateBanner() {
  const { isUpdateAvailable, isUpdatePending, isDownloading, isChecking } =
    Updates.useUpdates();
  const insets = useSafeAreaInsets();
  const [isProcessing, setIsProcessing] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Reset dismissed when a new update appears
  useEffect(() => {
    if (isUpdateAvailable || isUpdatePending) setDismissed(false);
  }, [isUpdateAvailable, isUpdatePending]);

  if (!Updates.isEnabled) return null;
  if (dismissed) return null;
  if (!isUpdateAvailable && !isUpdatePending) return null;

  const busy = isProcessing || isDownloading || isChecking;

  const onPressUpdate = async () => {
    try {
      setIsProcessing(true);
      if (isUpdatePending) {
        await Updates.reloadAsync();
      } else if (isUpdateAvailable) {
        const result = await Updates.fetchUpdateAsync();
        if (result.isNew) {
          await Updates.reloadAsync();
        } else {
          Alert.alert(
            "No new update",
            "You are already on the latest version.",
          );
        }
      }
    } catch (error) {
      Alert.alert(
        "Update failed",
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const title = isUpdatePending ? "Update ready" : "Update available";
  const message = isUpdatePending
    ? "Restart to apply the latest version."
    : "A new version is ready to download.";
  const buttonLabel = isUpdatePending
    ? "Restart"
    : isDownloading
      ? "Downloading…"
      : "Update";

  return (
    <View
      pointerEvents="box-none"
      style={[styles.updateOverlay, { bottom: Math.max(insets.bottom, 12) }]}
    >
      <View style={styles.updateCard}>
        <View style={styles.updateTextWrap}>
          <Text style={styles.updateTitle}>{title}</Text>
          <Text style={styles.updateMessage}>{message}</Text>
        </View>
        <View style={styles.updateActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={buttonLabel}
            onPress={() => setDismissed(true)}
            style={styles.dismissButton}
            disabled={busy}
          >
            <Text style={styles.dismissText}>Later</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={buttonLabel}
            onPress={onPressUpdate}
            disabled={busy}
            style={[styles.updateButton, busy && styles.updateButtonDisabled]}
          >
            {busy ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.updateButtonText}>{buttonLabel}</Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function RootNavigator() {
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded) queryClient.clear();
  }, [isLoaded, isSignedIn]);

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerBackButtonDisplayMode: "minimal" }}>
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={Boolean(isSignedIn)}>
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

const styles = StyleSheet.create({
  updateOverlay: {
    position: "absolute",
    left: 16,
    right: 16,
    alignItems: "center",
  },
  updateCard: {
    width: "100%",
    maxWidth: 480,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#0F172A",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.35)",
  },
  updateTextWrap: { flex: 1, gap: 2 },
  updateTitle: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  updateMessage: { color: "#CBD5E1", fontSize: 12, lineHeight: 16 },
  updateActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  dismissButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  dismissText: { color: "#94A3B8", fontSize: 13, fontWeight: "600" },
  updateButton: {
    minWidth: 92,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#2563EB",
  },
  updateButtonDisabled: { opacity: 0.6 },
  updateButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
});
