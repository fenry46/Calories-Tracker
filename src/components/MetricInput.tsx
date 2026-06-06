import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";

import { colors, radius, spacing } from "../theme";

interface Props {
  label: string;
  value: number;
  onChange: (next: number) => void;
  step?: number;
  min?: number;
  max?: number;
  /** Decimal places to display (e.g. 1 for weight). */
  precision?: number;
  /** Current unit label shown next to the value (e.g. "kg"). */
  unit?: string;
  /** If provided, renders a tappable unit pill that toggles units. */
  onToggleUnit?: () => void;
}

/**
 * Large, accessible stepper card for onboarding metrics (PRD §4: avoid form fatigue).
 */
export function MetricInput({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  precision = 0,
  unit,
  onToggleUnit,
}: Props) {
  const clamp = (n: number) => Math.min(Math.max(n, min), max);
  const dec = () => onChange(clamp(round(value - step)));
  const inc = () => onChange(clamp(round(value + step)));
  const round = (n: number) =>
    precision > 0 ? Number(n.toFixed(precision)) : Math.round(n);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        {unit && (
          <Pressable
            onPress={onToggleUnit}
            disabled={!onToggleUnit}
            style={styles.unitPill}
            accessibilityLabel={`Toggle unit for ${label}`}
          >
            <Text style={styles.unitText}>{unit}</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.stepper}>
        <Pressable
          style={styles.stepBtn}
          onPress={dec}
          accessibilityLabel={`Decrease ${label}`}
        >
          <Text style={styles.stepBtnText}>−</Text>
        </Pressable>

        <Text style={styles.value}>{value.toFixed(precision)}</Text>

        <Pressable
          style={styles.stepBtn}
          onPress={inc}
          accessibilityLabel={`Increase ${label}`}
        >
          <Text style={styles.stepBtnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  label: { fontSize: 18, fontWeight: "600", color: colors.text },
  unitPill: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  unitText: { color: colors.primary, fontWeight: "700" },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepBtn: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBtnText: { color: colors.white, fontSize: 28, fontWeight: "800", lineHeight: 30 },
  value: { fontSize: 40, fontWeight: "800", color: colors.text },
});
