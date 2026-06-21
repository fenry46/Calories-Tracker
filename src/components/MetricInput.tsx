import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";

import { colors, fonts, radius, spacing } from "../theme";

interface Props {
  label: string;
  value: number;
  onChange: (next: number) => void;
  step?: number;
  min?: number;
  max?: number;
  /** Decimal places to display (e.g. 1 for weight). */
  precision?: number;
  /** Current unit label shown under the label (e.g. "kg"). */
  unit?: string;
  /** If provided, the unit caption becomes tappable and toggles units. */
  onToggleUnit?: () => void;
}

/**
 * Compact horizontal stepper row for onboarding/settings metrics
 * (label + unit on the left, – value + on the right).
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
  const round = (n: number) =>
    precision > 0 ? Number(n.toFixed(precision)) : Math.round(n);
  const dec = () => onChange(clamp(round(value - step)));
  const inc = () => onChange(clamp(round(value + step)));

  return (
    <View style={styles.card}>
      <View style={styles.labelCol}>
        <Text style={styles.label}>{label}</Text>
        {unit ? (
          <Pressable onPress={onToggleUnit} disabled={!onToggleUnit} hitSlop={6}>
            <Text style={[styles.unit, onToggleUnit && styles.unitLink]}>{unit}</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.stepper}>
        <Pressable
          style={styles.stepBtn}
          onPress={dec}
          accessibilityLabel={`Decrease ${label}`}
        >
          <Text style={styles.stepBtnText}>–</Text>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.card,
    borderRadius: radius.md + 2,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md + 2,
  },
  labelCol: { gap: 1 },
  label: { fontFamily: fonts.heavy, fontSize: 16, color: colors.text },
  unit: { fontFamily: fonts.bold, fontSize: 13, color: colors.faint },
  unitLink: { color: colors.primary },
  stepper: { flexDirection: "row", alignItems: "center", gap: spacing.md - 2 },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: colors.stepBg,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBtnText: {
    fontFamily: fonts.heavy,
    color: colors.primary,
    fontSize: 22,
    lineHeight: 26,
  },
  value: {
    fontFamily: fonts.black,
    fontSize: 24,
    color: colors.text,
    minWidth: 56,
    textAlign: "center",
  },
});
