import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { colors } from "../theme";

interface Props {
  target: number;
  consumed: number;
  size?: number;
  strokeWidth?: number;
}

/**
 * Progress ring showing calories consumed vs. target.
 * Green while within budget, red once the target is exceeded (PRD §4).
 */
export function CalorieRing({
  target,
  consumed,
  size = 220,
  strokeWidth = 18,
}: Props) {
  const remaining = target - consumed;
  const exceeded = consumed > target;
  const ratio = target > 0 ? Math.min(consumed / target, 1) : 0;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - ratio);
  const ringColor = exceeded ? colors.danger : colors.primary;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.track}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          // start at 12 o'clock
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      <View style={styles.center} pointerEvents="none">
        <Text style={[styles.remaining, { color: ringColor }]}>
          {Math.abs(remaining)}
        </Text>
        <Text style={styles.label}>
          {exceeded ? "kcal over" : "kcal left"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  remaining: {
    fontSize: 48,
    fontWeight: "800",
  },
  label: {
    fontSize: 16,
    color: colors.muted,
    marginTop: 2,
  },
});
