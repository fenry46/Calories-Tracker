import React from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  StyleProp,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, radius, spacing } from "../theme";

type Variant = "primary" | "secondary" | "outline";

interface Props {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  /** Optional Ionicons name shown before the label. */
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
}

/** Shared button: primary (filled), secondary (surface), outline (bordered). */
export function AppButton({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  icon,
  style,
}: Props) {
  const isDisabled = disabled || loading;
  const textColor =
    variant === "primary" ? colors.white : variant === "outline" ? colors.text : colors.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" && styles.primary,
        variant === "secondary" && styles.secondary,
        variant === "outline" && styles.outline,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={18} color={textColor} style={styles.icon} />}
          <Text style={[styles.label, { color: textColor }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  outline: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.75 },
  icon: { marginRight: spacing.sm },
  label: { fontSize: 16, fontWeight: "700" },
});
