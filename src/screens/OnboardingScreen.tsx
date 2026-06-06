import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Alert, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MetricInput } from "../components/MetricInput";
import { Segmented } from "../components/Segmented";
import { BrandLogo } from "../components/BrandLogo";
import { InfoBox } from "../components/InfoBox";
import { AppButton } from "../components/AppButton";
import { useCalorieStore } from "../store/useCalorieStore";
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

const GOAL_DESCRIPTIONS: Record<WeightGoal, string> = {
  LOSE: "Create a calorie deficit",
  MAINTAIN: "Keep a balanced intake",
  GAIN: "Increase calories and build",
};

export function OnboardingScreen() {
  const createProfile = useCalorieStore((s) => s.createProfile);

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [sex, setSex] = useState<BiologicalSex | null>(null);
  const [age, setAge] = useState(25);

  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">("kg");
  const [weight, setWeight] = useState(70); // in current weightUnit

  const [heightUnit, setHeightUnit] = useState<"cm" | "in">("cm");
  const [height, setHeight] = useState(170); // in current heightUnit

  const [goal, setGoal] = useState<WeightGoal | null>(null);

  const weightKg = weightUnit === "kg" ? weight : lbsToKg(weight);
  const heightCm = heightUnit === "cm" ? height : inToCm(height);

  const previewTarget = useMemo(() => {
    if (!sex || !goal) return null;
    return calcDailyCalorieTarget(
      { biologicalSex: sex, age, weightKg, heightCm },
      goal
    );
  }, [sex, age, weightKg, heightCm, goal]);

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

  const steps = ["Name", "Sex", "Age", "Weight", "Height", "Goal"];
  const canAdvance =
    (step === 0 && name.trim().length > 0) ||
    (step === 1 && !!sex) ||
    (step === 2 && age > 0) ||
    (step === 3 && weight > 0) ||
    (step === 4 && height > 0) ||
    (step === 5 && !!goal);

  const submit = async () => {
    if (!sex || !goal) return;
    setSubmitting(true);
    const { error } = await createProfile({
      name: name.trim(),
      biologicalSex: sex,
      age,
      weightKg,
      heightCm,
      goal,
    });
    setSubmitting(false);
    if (error) Alert.alert("Could not save profile", error);
    // On success the store sets `profile`, which flips the navigator to Dashboard.
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* brand + step count */}
        <View style={styles.headerRow}>
          <BrandLogo size={20} />
          <Text style={styles.stepCount}>
            {step + 1} of {steps.length}
          </Text>
        </View>

        {/* progress dots */}
        <View style={styles.progress}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i <= step && styles.dotActive]}
            />
          ))}
        </View>

        <View style={styles.body}>
          {step === 0 && (
            <View>
              <Text style={styles.segTitle}>What's your name?</Text>
              <Text style={styles.segCaption}>So we can personalize your dashboard.</Text>
              <TextInput
                style={styles.nameInput}
                placeholder="Your name"
                placeholderTextColor={colors.muted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoFocus
                returnKeyType="next"
                onSubmitEditing={() => canAdvance && setStep(1)}
              />
            </View>
          )}

          {step === 1 && (
            <Segmented<BiologicalSex>
              title="Biological sex"
              caption="Used for an accurate BMR calculation."
              value={sex}
              onChange={setSex}
              options={[
                { value: "MALE", label: "Male" },
                { value: "FEMALE", label: "Female" },
              ]}
            />
          )}

          {step === 2 && (
            <MetricInput
              label="Age"
              value={age}
              onChange={setAge}
              min={14}
              max={100}
              step={1}
            />
          )}

          {step === 3 && (
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
          )}

          {step === 4 && (
            <View>
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
              <View style={styles.infoWrap}>
                <InfoBox>
                  We use your height, weight and age to estimate your basal
                  metabolic rate and set an accurate daily target.
                </InfoBox>
              </View>
            </View>
          )}

          {step === 5 && (
            <View>
              <Segmented<WeightGoal>
                title="What's your main goal?"
                caption="You can change this later in Settings."
                value={goal}
                onChange={setGoal}
                options={(Object.keys(GOAL_LABELS) as WeightGoal[]).map((g) => ({
                  value: g,
                  label: GOAL_LABELS[g],
                  description: GOAL_DESCRIPTIONS[g],
                }))}
              />
              {previewTarget != null && (
                <View style={styles.preview}>
                  <Text style={styles.previewLabel}>Your daily target</Text>
                  <Text style={styles.previewValue}>{previewTarget} kcal</Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.nav}>
          {step > 0 && (
            <AppButton
              label="Back"
              variant="secondary"
              onPress={() => setStep(step - 1)}
              style={styles.navBtn}
            />
          )}
          {step < steps.length - 1 ? (
            <AppButton
              label="Next"
              onPress={() => canAdvance && setStep(step + 1)}
              disabled={!canAdvance}
              style={styles.navBtn}
            />
          ) : (
            <AppButton
              label="Finish"
              onPress={submit}
              loading={submitting}
              disabled={!canAdvance}
              style={styles.navBtn}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: spacing.lg },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  stepCount: { color: colors.muted, fontSize: 14, fontWeight: "600" },
  progress: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  dot: {
    flex: 1,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.track,
  },
  dotActive: { backgroundColor: colors.primary },
  body: { flex: 1, justifyContent: "center" },
  nav: { flexDirection: "row", gap: spacing.md },
  navBtn: { flex: 1 },
  infoWrap: { marginTop: spacing.xl },
  segTitle: { fontSize: 22, fontWeight: "800", color: colors.text },
  segCaption: { color: colors.muted, marginTop: spacing.xs, marginBottom: spacing.lg },
  nameInput: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 18,
    color: colors.text,
  },
  preview: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.tint,
    alignItems: "center",
  },
  previewLabel: { color: colors.muted, fontSize: 14 },
  previewValue: { color: colors.primaryDark, fontSize: 32, fontWeight: "800", marginTop: 4 },
});
