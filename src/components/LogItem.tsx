import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";

import type { FoodEntry } from "../types/models";
import { colors, radius, spacing } from "../theme";

interface Props {
  entry: FoodEntry;
  onDelete?: (entry: FoodEntry) => void;
}

export function LogItem({ entry, onDelete }: Props) {
  const time = new Date(entry.scanned_at).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {entry.food_name}
        </Text>
        <Text style={styles.time}>{time}</Text>
      </View>
      <Text style={styles.kcal}>{entry.calories} kcal</Text>
      {onDelete && (
        <Pressable
          hitSlop={8}
          onPress={() => onDelete(entry)}
          style={styles.delete}
          accessibilityLabel={`Delete ${entry.food_name}`}
        >
          <Text style={styles.deleteText}>✕</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: "600", color: colors.text },
  time: { fontSize: 13, color: colors.muted, marginTop: 2 },
  kcal: { fontSize: 16, fontWeight: "700", color: colors.text, marginRight: spacing.md },
  delete: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteText: { fontSize: 16, color: colors.muted },
});
