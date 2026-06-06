import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "../lib/supabase";

interface AuthState {
  session: Session | null;
  /** False until the initial getSession() resolves — gates the splash/nav. */
  initialized: boolean;
  /** True while an auth action (sign-in/up) is in flight. */
  busy: boolean;

  init: () => () => void;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  initialized: false,
  busy: false,

  /** Load the persisted session and subscribe to auth changes. Returns an unsubscribe fn. */
  init: () => {
    supabase.auth.getSession().then(({ data }) => {
      set({ session: data.session, initialized: true });
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, initialized: true });
    });

    return () => sub.subscription.unsubscribe();
  },

  signUp: async (email, password) => {
    set({ busy: true });
    const { error } = await supabase.auth.signUp({ email, password });
    set({ busy: false });
    return error ? { error: error.message } : {};
  },

  signIn: async (email, password) => {
    set({ busy: true });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    set({ busy: false });
    return error ? { error: error.message } : {};
  },

  signOut: async () => {
    await supabase.auth.signOut();
  },

  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return error ? { error: error.message } : {};
  },
}));
