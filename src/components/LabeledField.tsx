import React from "react";
import { View, Text, StyleSheet } from "react-native";

import { colors, spacing } from "../theme";

interface Props {
  label: string;
  /** Optional node rendered on the right of the label (e.g. a "Show" toggle). */
  action?: React.ReactNode;
  children: React.ReactNode;
}

/** A form field with a label row above its control, matching the brand inputs. */
export function LabeledField({ label, action, children }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {action}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  label: { fontSize: 14, fontWeight: "700", color: colors.text },
});
