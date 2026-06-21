import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

import { colors, fonts, radius, shadow, spacing } from "../theme";

export interface SegOption<T> {
  value: T;
  label: string;
  /** Optional second line rendered under the label (descriptive cards). */
  description?: string;
  /** Optional leading glyph for descriptive cards (e.g. "↓"). */
  glyph?: string;
}

/**
 * A group of selectable option cards (single-select). Vertical by default;
 * pass `horizontal` for side-by-side pills (e.g. biological sex).
 */
export function Segmented<T extends string>({
  title,
  caption,
  value,
  onChange,
  options,
  horizontal = false,
}: {
  title?: string;
  caption?: string;
  value: T | null;
  onChange: (v: T) => void;
  options: SegOption<T>[];
  horizontal?: boolean;
}) {
  return (
    <View>
      {title ? <Text style={styles.segTitle}>{title}</Text> : null}
      {caption ? <Text style={styles.segCaption}>{caption}</Text> : null}
      <View style={[styles.segGroup, horizontal && styles.segGroupRow]}>
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <Pressable
              key={opt.value}
              style={[
                styles.segItem,
                horizontal && styles.segItemRow,
                opt.description ? styles.segItemDesc : null,
                active && styles.segItemActive,
              ]}
              onPress={() => onChange(opt.value)}
            >
              {opt.glyph ? (
                <View style={styles.glyphWrap}>
                  <Text style={styles.glyph}>{opt.glyph}</Text>
                </View>
              ) : null}
              <View style={opt.description ? styles.textCol : undefined}>
                <Text style={[styles.segText, active && styles.segTextActive]}>
                  {opt.label}
                </Text>
                {opt.description ? (
                  <Text style={styles.segDesc}>{opt.description}</Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  segTitle: { fontFamily: fonts.black, fontSize: 22, color: colors.text },
  segCaption: {
    fontFamily: fonts.bodySemibold,
    color: colors.muted,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  segGroup: { gap: spacing.md - 2, marginTop: spacing.sm },
  segGroupRow: { flexDirection: "row" },
  segItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md - 2,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  segItemRow: { flex: 1, justifyContent: "center" },
  segItemDesc: { alignItems: "center" },
  segItemActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryTintSoft,
    ...shadow.card,
  },
  textCol: { flex: 1 },
  glyphWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  glyph: { fontFamily: fonts.heavy, fontSize: 22, color: colors.primary },
  segText: { fontFamily: fonts.heavy, fontSize: 17, color: colors.text },
  segTextActive: { color: colors.primary },
  segDesc: { fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.muted, marginTop: 2 },
});
