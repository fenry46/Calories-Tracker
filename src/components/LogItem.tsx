import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";

import type { FoodEntry } from "../types/models";
import { colors, fonts, radius, spacing } from "../theme";

interface Props {
  entry: FoodEntry;
  onDelete?: (entry: FoodEntry) => void;
}

// Soft swatch tints, picked deterministically from the food name so each
// entry gets a stable, friendly thumbnail colour.
const TINTS = ["#F3E8D6", "#E7DDCF", "#E3ECD9", "#EFEAFC", "#E9F6EF", "#FBEADF"];

function tintFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return TINTS[h % TINTS.length];
}

export function LogItem({ entry, onDelete }: Props) {
  const time = new Date(entry.scanned_at).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <View style={styles.row}>
      <View style={[styles.thumb, { backgroundColor: tintFor(entry.food_name) }]} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {entry.food_name}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.time}>{time}</Text>
          {entry.protein > 0 && (
            <>
              <View style={styles.metaDot} />
              <Text style={styles.protein}>{entry.protein}g protein</Text>
            </>
          )}
        </View>
      </View>
      <Text style={styles.kcal}>{entry.calories}</Text>
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
    borderRadius: radius.md + 2,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.sm + 6,
    marginBottom: spacing.sm + 2,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: spacing.md - 2,
  },
  thumb: { width: 46, height: 46, borderRadius: 13 },
  info: { flex: 1 },
  name: { fontFamily: fonts.heavy, fontSize: 15, color: colors.text },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: 2 },
  time: { fontFamily: fonts.bold, fontSize: 12, color: colors.faint },
  metaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.faint },
  protein: { fontFamily: fonts.heavy, fontSize: 12, color: colors.protein },
  kcal: { fontFamily: fonts.black, fontSize: 16, color: colors.text },
  delete: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteText: { fontSize: 15, color: colors.faint },
});
