import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuthStore } from "../store/useAuthStore";
import { colors, radius, spacing } from "../theme";

type Mode = "signin" | "signup";

export function AuthScreen() {
  const { signIn, signUp, resetPassword, busy } = useAuthStore();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing details", "Enter your email and password.");
      return;
    }
    const action = mode === "signin" ? signIn : signUp;
    const { error } = await action(email.trim(), password);
    if (error) {
      Alert.alert(mode === "signin" ? "Sign in failed" : "Sign up failed", error);
    } else if (mode === "signup") {
      Alert.alert(
        "Check your inbox",
        "If email confirmation is enabled, confirm your address, then sign in."
      );
    }
  };

  const forgot = async () => {
    if (!email.trim()) {
      Alert.alert("Email needed", "Enter your email first, then tap reset.");
      return;
    }
    const { error } = await resetPassword(email.trim());
    Alert.alert(
      error ? "Could not send reset" : "Reset email sent",
      error ?? "Check your inbox for a password reset link."
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <Text style={styles.brand}>Calorie Tracker</Text>
        <Text style={styles.subtitle}>
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.muted}
          secureTextEntry
          autoCapitalize="none"
          value={password}
          onChangeText={setPassword}
        />

        <Pressable
          style={[styles.primaryBtn, busy && styles.btnDisabled]}
          onPress={submit}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.primaryBtnText}>
              {mode === "signin" ? "Sign In" : "Sign Up"}
            </Text>
          )}
        </Pressable>

        {mode === "signin" && (
          <Pressable onPress={forgot} style={styles.linkBtn}>
            <Text style={styles.link}>Forgot password?</Text>
          </Pressable>
        )}

        <View style={styles.switchRow}>
          <Text style={styles.muted}>
            {mode === "signin" ? "New here?" : "Already have an account?"}
          </Text>
          <Pressable
            onPress={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            <Text style={styles.link}>
              {mode === "signin" ? " Create an account" : " Sign in"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  brand: {
    fontSize: 34,
    fontWeight: "800",
    color: colors.primary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: colors.muted,
    textAlign: "center",
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.md,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: colors.white, fontSize: 17, fontWeight: "700" },
  linkBtn: { alignSelf: "center", marginTop: spacing.md },
  link: { color: colors.primary, fontWeight: "600" },
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.xl,
  },
  muted: { color: colors.muted },
});
