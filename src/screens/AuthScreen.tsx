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
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { BrandLogo } from "../components/BrandLogo";
import { AppButton } from "../components/AppButton";
import { LabeledField } from "../components/LabeledField";
import { useAuthStore } from "../store/useAuthStore";
import { colors, radius, spacing } from "../theme";

type Mode = "signin" | "signup";

export function AuthScreen() {
  const { signIn, signUp, resetPassword, busy } = useAuthStore();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    const action = mode === "signin" ? signIn : signUp;
    const { error: err } = await action(email.trim(), password);
    if (err) {
      setError(err);
    } else if (mode === "signup") {
      Alert.alert(
        "Check your inbox",
        "If email confirmation is enabled, confirm your address, then sign in."
      );
    }
  };

  const forgot = async () => {
    if (!email.trim()) {
      setError("Enter your email first, then tap forgot password.");
      return;
    }
    const { error: err } = await resetPassword(email.trim());
    Alert.alert(
      err ? "Could not send reset" : "Reset email sent",
      err ?? "Check your inbox for a password reset link."
    );
  };

  const toggleMode = () => {
    setError("");
    setMode(mode === "signin" ? "signup" : "signin");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <BrandLogo size={22} />

          <Text style={styles.heading}>
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </Text>
          <Text style={styles.subtitle}>
            {mode === "signin"
              ? "Sign in to continue your nutrition journey"
              : "Start tracking your meals in minutes"}
          </Text>

          <View style={styles.form}>
            <LabeledField label="Email">
              <TextInput
                style={styles.input}
                placeholder="you@domain.com"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
              />
            </LabeledField>

            <LabeledField
              label="Password"
              action={
                <Pressable onPress={() => setShowPassword((s) => !s)} hitSlop={8}>
                  <Text style={styles.showLink}>{showPassword ? "Hide" : "Show"}</Text>
                </Pressable>
              }
            >
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={colors.muted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
              />
            </LabeledField>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <AppButton
              label={mode === "signin" ? "Sign in" : "Create account"}
              onPress={submit}
              loading={busy}
              style={styles.submitBtn}
            />

            <View style={styles.linksRow}>
              {mode === "signin" && (
                <Pressable onPress={forgot}>
                  <Text style={styles.link}>Forgot password</Text>
                </Pressable>
              )}
              <Pressable onPress={toggleMode}>
                <Text style={styles.link}>
                  {mode === "signin" ? "Create account" : "Have an account? Sign in"}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Social (placeholder — not yet wired) */}
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.socialRow}>
            <AppButton
              label="Apple"
              variant="outline"
              icon="logo-apple"
              disabled
              style={styles.socialBtn}
            />
            <AppButton
              label="Google"
              variant="outline"
              icon="logo-google"
              disabled
              style={styles.socialBtn}
            />
          </View>
          <Text style={styles.comingSoon}>Social sign-in coming soon</Text>

          <Text style={styles.terms}>
            By continuing, you agree to NutriPen's Terms and Privacy Policy.
          </Text>
        </ScrollView>

        <View style={styles.footer}>
          <Ionicons name="lock-closed" size={13} color={colors.muted} />
          <Text style={styles.footerText}>Secure sign in</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingTop: spacing.xl },
  heading: { fontSize: 28, fontWeight: "800", color: colors.text, marginTop: spacing.xl },
  subtitle: { fontSize: 15, color: colors.muted, marginTop: spacing.xs },
  form: { marginTop: spacing.xl },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  showLink: { color: colors.primary, fontWeight: "700", fontSize: 13 },
  error: { color: colors.danger, fontWeight: "600", fontSize: 13, marginBottom: spacing.sm },
  submitBtn: { marginTop: spacing.sm },
  linksRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.lg,
  },
  link: { color: colors.primary, fontWeight: "600", fontSize: 14 },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  divider: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.muted, fontSize: 13 },
  socialRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.lg },
  socialBtn: { flex: 1 },
  comingSoon: {
    textAlign: "center",
    color: colors.muted,
    fontSize: 12,
    marginTop: spacing.sm,
  },
  terms: {
    textAlign: "center",
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: spacing.xl,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  footerText: { color: colors.muted, fontSize: 12 },
});
