import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, spacing } from "../theme";

interface Props {
  /** Wordmark font size; the leaf scales with it. Default 22. */
  size?: number;
  /** Hide the wordmark and show only the leaf mark. */
  iconOnly?: boolean;
}

/** NutriPen brand mark: a green leaf + wordmark. */
export function BrandLogo({ size = 22, iconOnly = false }: Props) {
  return (
    <View style={styles.row}>
      <View style={[styles.leafWrap, { width: size * 1.5, height: size * 1.5 }]}>
        <Ionicons name="leaf" size={size} color={colors.primary} />
      </View>
      {!iconOnly && (
        <Text style={[styles.wordmark, { fontSize: size }]}>NutriPen</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  leafWrap: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: colors.tint,
  },
  wordmark: { fontWeight: "800", color: colors.text, letterSpacing: -0.3 },
});
