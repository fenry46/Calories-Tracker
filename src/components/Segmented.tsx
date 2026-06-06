import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

import { colors, radius, spacing } from "../theme";

export interface SegOption<T> {
  value: T;
  label: string;
  /** Optional second line rendered under the label (descriptive cards). */
  description?: string;
}

/**
 * A vertical group of selectable option cards (single-select). Used for
 * biological sex and weight goal in onboarding and settings.
 */
export function Segmented<T extends string>({
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
              style={[
                styles.segItem,
                opt.description ? styles.segItemDesc : null,
                active && styles.segItemActive,
              ]}
              onPress={() => onChange(opt.value)}
            >
              <Text style={[styles.segText, active && styles.segTextActive]}>
                {opt.label}
              </Text>
              {opt.description ? (
                <Text style={[styles.segDesc, active && styles.segDescActive]}>
                  {opt.description}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  segItemDesc: { alignItems: "flex-start" },
  segItemActive: { borderColor: colors.primary, backgroundColor: colors.tint },
  segText: { fontSize: 17, fontWeight: "600", color: colors.text },
  segTextActive: { color: colors.primaryDark },
  segDesc: { fontSize: 13, color: colors.muted, marginTop: 4, textAlign: "left" },
  segDescActive: { color: colors.primaryDark },
});
