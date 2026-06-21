import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, fonts, radius, spacing } from "../theme";

interface Props {
  children: React.ReactNode;
}

/** A soft, tinted help box with an info icon — used for onboarding guidance. */
export function InfoBox({ children }: Props) {
  return (
    <View style={styles.box}>
      <Ionicons name="information-circle" size={20} color={colors.primaryDark} />
      <Text style={styles.text}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.tint,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  text: {
    flex: 1,
    color: colors.primaryDark,
    fontFamily: fonts.bodySemibold,
    fontSize: 13,
    lineHeight: 18,
  },
});
