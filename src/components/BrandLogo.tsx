import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

import { colors, spacing } from "../theme";

interface Props {
  /** Wordmark font size; the logo mark scales with it. Default 22. */
  size?: number;
  /** Hide the wordmark and show only the logo mark. */
  iconOnly?: boolean;
}

/** NutriPen brand mark: the leaf "N" logo + wordmark. */
export function BrandLogo({ size = 22, iconOnly = false }: Props) {
  const mark = size * 1.9;
  return (
    <View style={styles.row}>
      <Image
        source={require("../../assets/app-logo.png")}
        style={{ width: mark, height: mark }}
        resizeMode="contain"
      />
      {!iconOnly && (
        <Text style={[styles.wordmark, { fontSize: size }]}>NutriPen</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  wordmark: { fontWeight: "800", color: colors.text, letterSpacing: -0.3 },
});
