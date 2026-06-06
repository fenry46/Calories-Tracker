import React from "react";
import { Pressable, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, radius, spacing } from "../theme";

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  /** Optional caption under the value (e.g. "kcal" or "Coming soon"). */
  caption?: string;
  tint?: string;
  onPress?: () => void;
  disabled?: boolean;
}

/** A square stat/action card for the dashboard Quick-actions grid. */
export function QuickActionTile({
  icon,
  label,
  value,
  caption,
  tint = colors.tint,
  onPress,
  disabled = false,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      style={({ pressed }) => [
        styles.tile,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: tint }]}>
        <Ionicons name={icon} size={20} color={colors.primaryDark} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    minHeight: 116,
    justifyContent: "space-between",
  },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.8 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  value: { fontSize: 24, fontWeight: "800", color: colors.text, marginTop: spacing.sm },
  label: { fontSize: 14, fontWeight: "600", color: colors.text },
  caption: { fontSize: 12, color: colors.muted, marginTop: 2 },
});
