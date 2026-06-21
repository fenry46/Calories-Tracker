import React, { useId } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

import { colors, fonts, spacing } from "../theme";

interface Props {
  /** Wordmark font size; the logo mark scales with it. Default 22. */
  size?: number;
  /** Hide the wordmark and show only the logo mark. */
  iconOnly?: boolean;
  /** Reversed treatment for dark backgrounds (white "N", cream/leaf wordmark). */
  onDark?: boolean;
}

/** Fraction of the ring that's "filled" — an open ring, like the app's calorie ring. */
const RING_FRACTION = 0.74;

/**
 * NutriPen brand mark — an open calorie ring (purple→leaf-green gradient) around a
 * bold "N" monogram, plus the Nutri/Pen wordmark. Ported from the Claude Design
 * "NutriPen Logo System". Pure SVG so it stays crisp at any size.
 */
export function BrandLogo({ size = 22, iconOnly = false, onDark = false }: Props) {
  // Mark scales with the wordmark size, matching the prototype's proportions.
  const mark = Math.round(size * 1.9);
  const stroke = mark * 0.12;
  const radius = (mark - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - RING_FRACTION);

  // Unique gradient id per instance so multiple logos don't collide.
  const gradId = `np-ring-${useId()}`;

  const trackColor = onDark ? "rgba(255,255,255,0.16)" : colors.track;
  const monogramColor = onDark ? colors.white : colors.text;

  return (
    <View style={styles.row}>
      <View style={{ width: mark, height: mark }}>
        <Svg width={mark} height={mark}>
          <Defs>
            <LinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={colors.primary} />
              <Stop offset="58%" stopColor={colors.primary} />
              <Stop offset="100%" stopColor={colors.success} />
            </LinearGradient>
          </Defs>
          <Circle
            cx={mark / 2}
            cy={mark / 2}
            r={radius}
            stroke={trackColor}
            strokeWidth={stroke}
            fill="none"
          />
          <Circle
            cx={mark / 2}
            cy={mark / 2}
            r={radius}
            stroke={`url(#${gradId})`}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${mark / 2} ${mark / 2})`}
          />
        </Svg>
        <View style={styles.markCenter} pointerEvents="none">
          <Text
            style={[
              styles.monogram,
              { fontSize: mark * 0.46, color: monogramColor },
            ]}
          >
            N
          </Text>
        </View>
      </View>

      {!iconOnly && (
        <Text style={[styles.wordmark, { fontSize: size }]}>
          <Text style={{ color: onDark ? colors.bg : colors.text }}>Nutri</Text>
          <Text style={{ color: onDark ? colors.success : colors.primary }}>Pen</Text>
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  markCenter: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  monogram: { fontFamily: fonts.black, letterSpacing: -1 },
  wordmark: { fontFamily: fonts.black, letterSpacing: -0.6 },
});
