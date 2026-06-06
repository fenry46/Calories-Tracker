import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { ENV } from "./env";
import type { Database } from "../types/database";

/**
 * SecureStore-backed storage adapter for the Supabase auth session.
 * Tokens land in the iOS Keychain / Android encrypted store (PRD §5).
 * SecureStore is unavailable on web, so fall back to localStorage there.
 */
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    if (Platform.OS === "web") {
      return Promise.resolve(globalThis.localStorage?.getItem(key) ?? null);
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === "web") {
      globalThis.localStorage?.setItem(key, value);
      return Promise.resolve();
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === "web") {
      globalThis.localStorage?.removeItem(key);
      return Promise.resolve();
    }
    return SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient<Database>(
  ENV.supabaseUrl,
  ENV.supabaseAnonKey,
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
