import { expoClient } from "@better-auth/expo/client";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";
import * as SecureStore from "expo-secure-store";
import { useCallback } from "react";

import { env } from "@/config/env";

const BEARER_TOKEN_KEY = "stubady-bearer-token";

// Synchronous copy of the latest bearer token. SecureStore writes are
// async, so without this a sign-in followed by an immediate API call could
// read a stale (null) token. Survives for the process lifetime; SecureStore
// below survives app restarts.
let cachedBearerToken: string | null = null;

const saveBearerToken = (token: string): void => {
  cachedBearerToken = token;
  void SecureStore.setItemAsync(BEARER_TOKEN_KEY, token).catch(() => {});
};

const clearBearerToken = (): void => {
  cachedBearerToken = null;
  void SecureStore.deleteItemAsync(BEARER_TOKEN_KEY).catch(() => {});
  // Native module missing under Expo Go — ignore so sign-out still works.
  try {
    void GoogleSignin.signOut().catch(() => {});
  } catch {
    // ignore
  }
};

export const authClient = createAuthClient({
  baseURL: `${env.apiUrl}/api/auth`,
  plugins: [
    expoClient({
      scheme: "mobile",
      storagePrefix: "stubady",
      storage: SecureStore,
    }),
    emailOTPClient(),
  ],
  fetchOptions: {
    onSuccess: (ctx) => {
      // Bearer plugin: every sign-in/sign-up response carries the session
      // bearer token here. Capture it for `Authorization: Bearer` API calls.
      const token = ctx.response.headers.get("set-auth-token");
      if (token) saveBearerToken(token);
    },
  },
});

/** Drop-in token source for `apiRequest` (`GetToken` shape). */
export const getBearerToken = async (): Promise<string | null> =>
  cachedBearerToken ?? SecureStore.getItemAsync(BEARER_TOKEN_KEY);

export const useBearerToken = (): (() => Promise<string | null>) =>
  useCallback(() => getBearerToken(), []);

/** Clerk-shaped session user so existing screens keep their field access. */
export type SessionUser = {
  fullName: string;
  firstName: string;
  imageUrl: string | null;
  email: string;
};

export const useSessionUser = (): {
  user: SessionUser | undefined;
  isPending: boolean;
} => {
  const { data: session, isPending } = authClient.useSession();
  const raw = session?.user;
  const name = raw?.name?.trim() || (raw?.email?.split("@")[0] ?? "");
  const user = raw
    ? {
        fullName: name,
        firstName: name.split(/\s+/)[0] || name,
        imageUrl: raw.image ?? null,
        email: raw.email,
      }
    : undefined;
  return { user, isPending };
};

export const useIsSignedIn = (): {
  isSignedIn: boolean;
  isPending: boolean;
} => {
  const { data: session, isPending } = authClient.useSession();
  return { isSignedIn: Boolean(session), isPending };
};

export const signOut = async (): Promise<void> => {
  try {
    await authClient.signOut();
  } finally {
    clearBearerToken();
  }
};
