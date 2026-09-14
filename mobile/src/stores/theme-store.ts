import * as SecureStore from "expo-secure-store";
import { useColorScheme } from "react-native";
import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";

import { getPalette, type ColorSchemeName, type Palette } from "@/theme";

export type ThemePreference = "system" | ColorSchemeName;

type ThemeState = {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
};

// SecureStore is already a dependency (Clerk token cache) and survives app
// restarts, so the theme choice persists without adding AsyncStorage.
const secureStorage: StateStorage = {
  getItem: async (key) => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key, value) => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // Theme persistence is best-effort — the app works without it.
    }
  },
  removeItem: async (key) => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Ignore — nothing to clean up.
    }
  },
};

/**
 * App-wide theme preference. This is client UI state shared across every
 * screen (any screen can read it, Settings writes it), so it lives in a
 * Zustand store — not React Context, and not in TanStack Query (not server
 * state). Colors themselves stay in `@/theme`; this store only resolves
 * which palette is active.
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      preference: "system",
      setPreference: (preference) => set({ preference }),
    }),
    {
      name: "theme-preference",
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({ preference: state.preference }),
    },
  ),
);

export type AppTheme = {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  scheme: ColorSchemeName;
  palette: Palette;
  isDark: boolean;
};

/** Reactive theme for components. Re-renders only the scheme/preference. */
export function useTheme(): AppTheme {
  const preference = useThemeStore((state) => state.preference);
  const setPreference = useThemeStore((state) => state.setPreference);
  const system = useColorScheme();
  const scheme: ColorSchemeName =
    preference === "system"
      ? system === "dark"
        ? "dark"
        : "light"
      : preference;
  return {
    preference,
    setPreference,
    scheme,
    palette: getPalette(scheme),
    isDark: scheme === "dark",
  };
}
