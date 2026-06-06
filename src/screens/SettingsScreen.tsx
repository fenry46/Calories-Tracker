import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MetricInput } from "../components/MetricInput";
import { Segmented } from "../components/Segmented";
import { useCalorieStore } from "../store/useCalorieStore";
import { useAuthStore } from "../store/useAuthStore";
import type { BiologicalSex, WeightGoal } from "../types/models";
import {
  calcDailyCalorieTarget,
  kgToLbs,
  lbsToKg,
  cmToIn,
  inToCm,
} from "../utils/calorieCalculator";
import { colors, radius, spacing } from "../theme";

const GOAL_LABELS: Record<WeightGoal, string> = {
  LOSE: "Lose weight",
  MAINTAIN: "Maintain weight",
  GAIN: "Gain weight",
};

const MIN_PASSWORD = 6;

export function SettingsScreen() {
  const profile = useCalorieStore((s) => s.profile);
  const updateProfile = useCalorieStore((s) => s.updateProfile);
  const session = useAuthStore((s) => s.session);
  const signOut = useAuthStore((s) => s.signOut);
  const changePassword = useAuthStore((s) => s.changePassword);

  // ---- Profile fields (prefilled from the current profile) ----
  const [name, setName] = useState(profile?.name ?? "");
  const [sex, setSex] = useState<BiologicalSex>(profile?.biological_sex ?? "MALE");
  const [age, setAge] = useState(profile?.age ?? 25);

  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">("kg");
  const [weight, setWeight] = useState(profile?.weight ?? 70); // in current unit

  const [heightUnit, setHeightUnit] = useState<"cm" | "in">("cm");
  const [height, setHeight] = useState(profile?.height ?? 170); // in current unit

  const [goal, setGoal] = useState<WeightGoal>(profile?.goal ?? "MAINTAIN");
  const [savingProfile, setSavingProfile] = useState(false);

  // ---- Password fields ----
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const weightKg = weightUnit === "kg" ? weight : lbsToKg(weight);
  const heightCm = heightUnit === "cm" ? height : inToCm(height);

  const previewTarget = useMemo(
    () =>
      calcDailyCalorieTarget(
        { biologicalSex: sex, age, weightKg, heightCm },
        goal
      ),
    [sex, age, weightKg, heightCm, goal]
  );

  const toggleWeightUnit = () => {
    if (weightUnit === "kg") {
      setWeight(Number(kgToLbs(weight).toFixed(1)));
      setWeightUnit("lbs");
    } else {
      setWeight(Number(lbsToKg(weight).toFixed(1)));
      setWeightUnit("kg");
    }
  };

  const toggleHeightUnit = () => {
    if (heightUnit === "cm") {
      setHeight(Number(cmToIn(height).toFixed(1)));
      setHeightUnit("in");
    } else {
      setHeight(Number(inToCm(height).toFixed(1)));
      setHeightUnit("cm");
    }
  };

  const saveProfile = async () => {
    if (!name.trim()) {
      Alert.alert("Check your name", "Please enter a name.");
      return;
    }
    setSavingProfile(true);
    const { error } = await updateProfile({
      name: name.trim(),
      biologicalSex: sex,
      age,
      weightKg,
      heightCm,
      goal,
    });
    setSavingProfile(false);
    if (error) {
      Alert.alert("Could not save", error);
      return;
    }
    Alert.alert("Saved", "Your profile has been updated.");
  };

  const submitPassword = async () => {
    if (newPassword.length < MIN_PASSWORD) {
      Alert.alert(
        "Password too short",
        `Use at least ${MIN_PASSWORD} characters.`
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Passwords don't match", "Re-enter the same password twice.");
      return;
    }
    setChangingPassword(true);
    const { error } = await changePassword(newPassword);
    setChangingPassword(false);
    if (error) {
      Alert.alert("Could not change password", error);
      return;
    }
    setNewPassword("");
    setConfirmPassword("");
    Alert.alert("Password changed", "Your password has been updated.");
  };

  const confirmSignOut = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => signOut() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Account */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Email</Text>
          <Text style={styles.emailValue}>{session?.user?.email ?? "—"}</Text>

          <View style={styles.divider} />

          <Text style={styles.fieldLabel}>Change password</Text>
          <TextInput
            style={styles.input}
            placeholder="New password"
            placeholderTextColor={colors.muted}
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Confirm new password"
            placeholderTextColor={colors.muted}
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            autoCapitalize="none"
          />
          <Pressable
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
            onPress={submitPassword}
            disabled={changingPassword}
          >
            {changingPassword ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={styles.secondaryBtnText}>Update password</Text>
            )}
          </Pressable>
        </View>

        {/* Profile */}
        <Text style={styles.sectionTitle}>Profile</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor={colors.muted}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <View style={styles.spacer} />
          <Segmented<BiologicalSex>
            title="Biological sex"
            value={sex}
            onChange={setSex}
            options={[
              { value: "MALE", label: "Male" },
              { value: "FEMALE", label: "Female" },
            ]}
          />

          <View style={styles.spacer} />
          <MetricInput label="Age" value={age} onChange={setAge} min={14} max={100} step={1} />

          <View style={styles.spacer} />
          <MetricInput
            label="Weight"
            value={weight}
            onChange={setWeight}
            min={1}
            step={weightUnit === "kg" ? 0.5 : 1}
            precision={1}
            unit={weightUnit}
            onToggleUnit={toggleWeightUnit}
          />

          <View style={styles.spacer} />
          <MetricInput
            label="Height"
            value={height}
            onChange={setHeight}
            min={1}
            step={heightUnit === "cm" ? 1 : 0.5}
            precision={heightUnit === "cm" ? 0 : 1}
            unit={heightUnit}
            onToggleUnit={toggleHeightUnit}
          />

          <View style={styles.spacer} />
          <Segmented<WeightGoal>
            title="Your goal"
            value={goal}
            onChange={setGoal}
            options={(Object.keys(GOAL_LABELS) as WeightGoal[]).map((g) => ({
              value: g,
              label: GOAL_LABELS[g],
            }))}
          />

          <View style={styles.preview}>
            <Text style={styles.previewLabel}>New daily target</Text>
            <Text style={styles.previewValue}>{previewTarget} kcal</Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
            onPress={saveProfile}
            disabled={savingProfile}
          >
            {savingProfile ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.primaryBtnText}>Save changes</Text>
            )}
          </Pressable>
        </View>

        {/* Sign out */}
        <Pressable
          style={({ pressed }) => [styles.signOutBtn, pressed && styles.pressed]}
          onPress={confirmSignOut}
        >
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: { fontSize: 24, fontWeight: "800", color: colors.text },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  fieldLabel: { fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: spacing.sm },
  emailValue: { fontSize: 16, color: colors.muted },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.lg },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.md,
  },
  spacer: { height: spacing.lg },
  preview: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.tint,
    alignItems: "center",
  },
  previewLabel: { color: colors.muted, fontSize: 14 },
  previewValue: { color: colors.primaryDark, fontSize: 32, fontWeight: "800", marginTop: 4 },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  primaryBtnText: { color: colors.white, fontSize: 17, fontWeight: "700" },
  secondaryBtn: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  secondaryBtnText: { color: colors.primary, fontSize: 16, fontWeight: "700" },
  signOutBtn: {
    marginTop: spacing.xl,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.danger,
  },
  signOutText: { color: colors.danger, fontSize: 16, fontWeight: "700" },
  pressed: { opacity: 0.7 },
});
