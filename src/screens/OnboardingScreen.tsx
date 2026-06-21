import React, { useState } from "react";
import { View, Text, StyleSheet, Alert, TextInput, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { MetricInput } from "../components/MetricInput";
import { Segmented } from "../components/Segmented";
import { AppButton } from "../components/AppButton";
import { useCalorieStore } from "../store/useCalorieStore";
import type { BiologicalSex, WeightGoal } from "../types/models";
import {
  calcBMR,
  calcTDEE,
  calcTarget,
  GOAL_ADJUSTMENT,
  kgToLbs,
  lbsToKg,
  cmToIn,
  inToCm,
} from "../utils/calorieCalculator";
import { colors, fonts, radius, spacing } from "../theme";

type Step = "welcome" | "metrics" | "goal" | "target";

const GOAL_LABELS: Record<WeightGoal, string> = {
  LOSE: "Lose weight",
  MAINTAIN: "Maintain weight",
  GAIN: "Gain weight",
};
const GOAL_DESCRIPTIONS: Record<WeightGoal, string> = {
  LOSE: "500 kcal below maintenance",
  MAINTAIN: "Stay at maintenance calories",
  GAIN: "400 kcal above maintenance",
};
const GOAL_GLYPHS: Record<WeightGoal, string> = { LOSE: "↓", MAINTAIN: "=", GAIN: "↑" };

export function OnboardingScreen() {
  const createProfile = useCalorieStore((s) => s.createProfile);

  const [step, setStep] = useState<Step>("welcome");
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [sex, setSex] = useState<BiologicalSex>("FEMALE");
  const [age, setAge] = useState(29);

  const [units, setUnits] = useState<"metric" | "imperial">("metric");
  const [weight, setWeight] = useState(72); // in current weight unit
  const [height, setHeight] = useState(172); // in current height unit

  const weightUnit = units === "metric" ? "kg" : "lbs";
  const heightUnit = units === "metric" ? "cm" : "in";
  const weightKg = units === "metric" ? weight : lbsToKg(weight);
  const heightCm = units === "metric" ? height : inToCm(height);

  const [goal, setGoal] = useState<WeightGoal>("LOSE");

  const toggleUnits = () => {
    if (units === "metric") {
      setWeight(Number(kgToLbs(weight).toFixed(0)));
      setHeight(Number(cmToIn(height).toFixed(0)));
      setUnits("imperial");
    } else {
      setWeight(Number(lbsToKg(weight).toFixed(0)));
      setHeight(Number(inToCm(height).toFixed(0)));
      setUnits("metric");
    }
  };

  const metrics = { biologicalSex: sex, age, weightKg, heightCm };
  const bmr = Math.round(calcBMR(metrics));
  const tdee = Math.round(calcTDEE(bmr));
  const target = calcTarget(calcTDEE(calcBMR(metrics)), goal);

  const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

  const submit = async () => {
    setSubmitting(true);
    const { error } = await createProfile({
      name: name.trim() || "Friend",
      biologicalSex: sex,
      age,
      weightKg,
      heightCm,
      goal,
    });
    setSubmitting(false);
    if (error) Alert.alert("Could not save profile", error);
    // On success the store sets `profile`, which flips the navigator to Home.
  };

  // ---------- WELCOME ----------
  if (step === "welcome") {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.welcomeWrap}>
          <View style={styles.heroCards}>
            <View style={[styles.heroCard, styles.heroCardLeft]} />
            <View style={[styles.heroCard, styles.heroCardMid]}>
              <View style={styles.heroPill}>
                <View style={styles.heroDot} />
                <Text style={styles.heroPillText}>350 kcal</Text>
              </View>
            </View>
            <View style={[styles.heroCard, styles.heroCardRight]} />
          </View>

          <View style={styles.welcomeText}>
            <Text style={styles.welcomeTitle}>Snap a photo.{"\n"}Know your calories.</Text>
            <Text style={styles.welcomeSub}>
              Set a personal daily budget, then log meals in one tap with the AI food scanner.
            </Text>
          </View>

          <AppButton label="Get started" onPress={() => setStep("metrics")} />
        </View>
      </SafeAreaView>
    );
  }

  // ---------- METRICS ----------
  if (step === "metrics") {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.headerArea}>
          <Header onBack={() => setStep("welcome")} progress={1} />
          <Text style={styles.h2}>Tell us about you</Text>
          <Text style={styles.lead}>We use this to estimate your daily calorie budget.</Text>
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Your name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Maya"
              placeholderTextColor={colors.faint}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Biological sex</Text>
            <Segmented<BiologicalSex>
              horizontal
              value={sex}
              onChange={setSex}
              options={[
                { value: "FEMALE", label: "Female" },
                { value: "MALE", label: "Male" },
              ]}
            />
          </View>

          <MetricInput label="Age" unit="years" value={age} onChange={setAge} min={13} max={99} />
          <MetricInput
            label="Weight"
            unit={weightUnit}
            value={weight}
            onChange={setWeight}
            min={1}
          />
          <MetricInput
            label="Height"
            unit={heightUnit}
            value={height}
            onChange={setHeight}
            min={1}
          />

          <Pressable onPress={toggleUnits} hitSlop={6} style={styles.unitToggle}>
            <Text style={styles.unitToggleText}>
              Switch to {units === "metric" ? "lb / in" : "kg / cm"}
            </Text>
          </Pressable>
        </ScrollView>

        <View style={styles.footer}>
          <AppButton label="Continue" onPress={() => setStep("goal")} />
        </View>
      </SafeAreaView>
    );
  }

  // ---------- GOAL ----------
  if (step === "goal") {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.headerArea}>
          <Header onBack={() => setStep("metrics")} progress={2} />
          <Text style={styles.h2}>What's your goal?</Text>
          <Text style={styles.lead}>This adjusts your target up or down from maintenance.</Text>
        </View>

        <View style={styles.body}>
          <Segmented<WeightGoal>
            value={goal}
            onChange={setGoal}
            options={(Object.keys(GOAL_LABELS) as WeightGoal[]).map((g) => ({
              value: g,
              label: GOAL_LABELS[g],
              description: GOAL_DESCRIPTIONS[g],
              glyph: GOAL_GLYPHS[g],
            }))}
          />
        </View>

        <View style={styles.footer}>
          <AppButton label="Calculate my target" onPress={() => setStep("target")} />
        </View>
      </SafeAreaView>
    );
  }

  // ---------- TARGET ----------
  const goalWord = goal === "LOSE" ? "Lose" : goal === "GAIN" ? "Gain" : "Maintain";
  const adj = GOAL_ADJUSTMENT[goal];
  const adjStr = adj > 0 ? `+${adj}` : adj < 0 ? `−${Math.abs(adj)}` : "±0";
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.targetWrap}>
        <View style={styles.targetCenter}>
          <Text style={styles.targetEyebrow}>YOUR DAILY TARGET</Text>
          <View style={styles.targetNumRow}>
            <Text style={styles.targetNum}>{fmt(target)}</Text>
            <Text style={styles.targetUnit}>kcal</Text>
          </View>
          <Text style={styles.targetNote}>
            Calculated from your metrics with the Mifflin-St Jeor formula.
          </Text>

          <View style={styles.breakdown}>
            <BreakdownRow label="BMR (Mifflin-St Jeor)" value={`${fmt(bmr)} kcal`} />
            <BreakdownRow label="TDEE (× 1.2 sedentary)" value={`${fmt(tdee)} kcal`} />
            <BreakdownRow
              label={`${goalWord} adjustment`}
              value={`${adjStr} kcal`}
              accent
              last
            />
          </View>
        </View>

        <AppButton label="Start tracking" onPress={submit} loading={submitting} />
      </View>
    </SafeAreaView>
  );
}

function Header({ onBack, progress }: { onBack: () => void; progress: number }) {
  return (
    <View style={styles.headerRow}>
      <Pressable onPress={onBack} style={styles.backBtn} accessibilityLabel="Back">
        <Ionicons name="arrow-back" size={20} color={colors.text} />
      </Pressable>
      <View style={styles.progress}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={[styles.dot, i <= progress && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

function BreakdownRow({
  label,
  value,
  accent,
  last,
}: {
  label: string;
  value: string;
  accent?: boolean;
  last?: boolean;
}) {
  return (
    <View style={[styles.brRow, !last && styles.brDivider]}>
      <Text style={styles.brLabel}>{label}</Text>
      <Text style={[styles.brValue, accent && styles.brValueAccent]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  // welcome
  welcomeWrap: { flex: 1, padding: spacing.lg, paddingBottom: spacing.xl, justifyContent: "space-between" },
  heroCards: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.md, marginTop: spacing.xl * 2 },
  heroCard: { width: 100, height: 128, borderRadius: 22 },
  heroCardLeft: { backgroundColor: "#EFE7D6", transform: [{ rotate: "-7deg" }] },
  heroCardMid: {
    width: 110,
    height: 142,
    backgroundColor: "#E3ECD9",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 14,
  },
  heroCardRight: { backgroundColor: "#E2D8FA", transform: [{ rotate: "7deg" }] },
  heroPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.white,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
  },
  heroDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  heroPillText: { fontFamily: fonts.heavy, fontSize: 12, color: colors.text },
  welcomeText: { alignItems: "center", paddingHorizontal: spacing.sm },
  welcomeTitle: {
    fontFamily: fonts.black,
    fontSize: 32,
    lineHeight: 36,
    color: colors.text,
    textAlign: "center",
    letterSpacing: -0.8,
  },
  welcomeSub: {
    fontFamily: fonts.bodySemibold,
    fontSize: 16,
    lineHeight: 24,
    color: colors.muted,
    textAlign: "center",
    marginTop: spacing.md,
  },

  // shared header
  headerArea: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.md },
  headerRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.stepBg,
    alignItems: "center",
    justifyContent: "center",
  },
  progress: { flex: 1, flexDirection: "row", gap: 6 },
  dot: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary },
  h2: { fontFamily: fonts.black, fontSize: 26, color: colors.text, letterSpacing: -0.5 },
  lead: { fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.muted, marginTop: -spacing.sm },

  body: { padding: spacing.lg, gap: spacing.md + 2 },
  fieldGroup: { gap: spacing.sm },
  fieldLabel: {
    fontFamily: fonts.heavy,
    fontSize: 13,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontFamily: fonts.bodySemibold,
    fontSize: 16,
    color: colors.text,
  },
  unitToggle: { alignSelf: "flex-start", paddingVertical: spacing.xs },
  unitToggleText: { fontFamily: fonts.heavy, fontSize: 14, color: colors.primary },
  footer: { padding: spacing.lg },

  // target
  targetWrap: { flex: 1, padding: spacing.lg, justifyContent: "space-between" },
  targetCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  targetEyebrow: {
    fontFamily: fonts.heavy,
    fontSize: 14,
    color: colors.muted,
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  targetNumRow: { flexDirection: "row", alignItems: "baseline", gap: spacing.sm },
  targetNum: { fontFamily: fonts.black, fontSize: 76, lineHeight: 80, color: colors.primary, letterSpacing: -2 },
  targetUnit: { fontFamily: fonts.heavy, fontSize: 22, color: colors.muted },
  targetNote: {
    fontFamily: fonts.bodySemibold,
    fontSize: 15,
    color: colors.muted,
    textAlign: "center",
    maxWidth: 240,
    lineHeight: 22,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  breakdown: {
    width: "100%",
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
  },
  brRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md - 2,
  },
  brDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  brLabel: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.muted },
  brValue: { fontFamily: fonts.heavy, fontSize: 16, color: colors.text },
  brValueAccent: { color: colors.primary },
});
