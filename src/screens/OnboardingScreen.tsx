import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MetricInput } from "../components/MetricInput";
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

export function OnboardingScreen() {
  const createProfile = useCalorieStore((s) => s.createProfile);

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

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

  const steps = ["Sex", "Age", "Weight", "Height", "Goal"];
  const canAdvance =
    (step === 0 && !!sex) ||
    (step === 1 && age > 0) ||
    (step === 2 && weight > 0) ||
    (step === 3 && height > 0) ||
    (step === 4 && !!goal);

  const submit = async () => {
    if (!sex || !goal) return;
    setSubmitting(true);
    const { error } = await createProfile({
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
        {/* progress dots */}
        <View style={styles.progress}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i <= step && styles.dotActive]}
            />
          ))}
        </View>

        <Text style={styles.stepLabel}>
          Step {step + 1} of {steps.length}
        </Text>

        <View style={styles.body}>
          {step === 0 && (
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

          {step === 1 && (
            <MetricInput
              label="Age"
              value={age}
              onChange={setAge}
              min={14}
              max={100}
              step={1}
            />
          )}

          {step === 2 && (
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

          {step === 3 && (
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
          )}

          {step === 4 && (
            <View>
              <Segmented<WeightGoal>
                title="Your goal"
                value={goal}
                onChange={setGoal}
                options={(Object.keys(GOAL_LABELS) as WeightGoal[]).map((g) => ({
                  value: g,
                  label: GOAL_LABELS[g],
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
            <Pressable
              style={[styles.navBtn, styles.backBtn]}
              onPress={() => setStep(step - 1)}
            >
              <Text style={styles.backText}>Back</Text>
            </Pressable>
          )}
          {step < steps.length - 1 ? (
            <Pressable
              style={[styles.navBtn, styles.nextBtn, !canAdvance && styles.disabled]}
              onPress={() => canAdvance && setStep(step + 1)}
              disabled={!canAdvance}
            >
              <Text style={styles.nextText}>Next</Text>
            </Pressable>
          ) : (
            <Pressable
              style={[styles.navBtn, styles.nextBtn, (!canAdvance || submitting) && styles.disabled]}
              onPress={submit}
              disabled={!canAdvance || submitting}
            >
              {submitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.nextText}>Finish</Text>
              )}
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

interface SegOption<T> {
  value: T;
  label: string;
}
function Segmented<T extends string>({
  title,
  caption,
  value,
  onChange,
  options,
}: {
  title: string;
  caption?: string;
  value: T | null;
  onChange: (v: T) => void;
  options: SegOption<T>[];
}) {
  return (
    <View>
      <Text style={styles.segTitle}>{title}</Text>
      {caption && <Text style={styles.segCaption}>{caption}</Text>}
      <View style={styles.segGroup}>
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <Pressable
              key={opt.value}
              style={[styles.segItem, active && styles.segItemActive]}
              onPress={() => onChange(opt.value)}
            >
              <Text style={[styles.segText, active && styles.segTextActive]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: spacing.lg },
  progress: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  dot: {
    flex: 1,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.track,
  },
  dotActive: { backgroundColor: colors.primary },
  stepLabel: { color: colors.muted, marginBottom: spacing.lg },
  body: { flex: 1, justifyContent: "center" },
  nav: { flexDirection: "row", gap: spacing.md },
  navBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
  },
  backBtn: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  backText: { color: colors.text, fontWeight: "700", fontSize: 16 },
  nextBtn: { backgroundColor: colors.primary },
  nextText: { color: colors.white, fontWeight: "700", fontSize: 16 },
  disabled: { opacity: 0.4 },
  segTitle: { fontSize: 22, fontWeight: "800", color: colors.text },
  segCaption: { color: colors.muted, marginTop: spacing.xs, marginBottom: spacing.lg },
  segGroup: { gap: spacing.md, marginTop: spacing.md },
  segItem: {
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
  },
  segItemActive: { borderColor: colors.primary, backgroundColor: "#ECFDF3" },
  segText: { fontSize: 17, fontWeight: "600", color: colors.text },
  segTextActive: { color: colors.primaryDark },
  preview: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: "#ECFDF3",
    alignItems: "center",
  },
  previewLabel: { color: colors.muted, fontSize: 14 },
  previewValue: { color: colors.primaryDark, fontSize: 32, fontWeight: "800", marginTop: 4 },
});
