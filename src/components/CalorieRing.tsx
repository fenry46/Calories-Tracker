import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { colors, fonts } from "../theme";

interface Props {
  target: number;
  consumed: number;
  size?: number;
  strokeWidth?: number;
}

/**
 * Progress ring showing calories consumed vs. target.
 * Green while within budget, warm orange once the target is exceeded (PRD §4).
 */
export function CalorieRing({
  target,
  consumed,
  size = 210,
  strokeWidth = 20,
}: Props) {
  const remaining = target - consumed;
  const exceeded = consumed > target;
  const ratio = target > 0 ? Math.min(consumed / target, 1) : 0;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - ratio);
  const ringColor = exceeded ? colors.danger : colors.success;

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
        <Text style={styles.remaining}>{Math.abs(remaining)}</Text>
        <Text style={styles.label}>kcal {exceeded ? "over" : "left"}</Text>
        {target > 0 && (
          <Text style={styles.sub}>of {target.toLocaleString("en-US")} target</Text>
        )}
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
    fontFamily: fonts.black,
    fontSize: 52,
    color: colors.text,
    letterSpacing: -1.5,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.muted,
    marginTop: 4,
  },
  sub: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.faint,
    marginTop: 2,
  },
});
