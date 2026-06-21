import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { CalorieRing } from "../components/CalorieRing";
import { LogItem } from "../components/LogItem";
import { useCalorieStore } from "../store/useCalorieStore";
import type { FoodEntry } from "../types/models";
import { addDays, formatDateLabel, isToday } from "../utils/date";
import { colors, fonts, radius, shadow, spacing } from "../theme";
import type { MainTabScreenProps } from "../navigation/types";

type Props = MainTabScreenProps<"Home">;

function greetingForNow(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function HomeScreen({ navigation }: Props) {
  const {
    profile,
    log,
    entries,
    selectedDate,
    selectDate,
    removeFoodEntry,
    refresh,
    isLoading,
  } = useCalorieStore();

  const target = log?.total_target ?? profile?.daily_calorie_target ?? 0;
  const consumed = log?.total_consumed ?? 0;
  const remaining = target - consumed;
  const atToday = isToday(selectedDate);
  const pct = target > 0 ? Math.round((consumed / target) * 100) : 0;
  const showInitialLoading = isLoading && !log;

  const onDelete = useCallback(
    (entry: FoodEntry) => {
      Alert.alert("Remove entry", `Remove "${entry.food_name}"?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            const { error } = await removeFoodEntry(entry.id);
            if (error) Alert.alert("Error", error);
          },
        },
      ]);
    },
    [removeFoodEntry]
  );

  const initial = (profile?.name?.trim()?.[0] ?? "•").toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View style={styles.headerRow}>
              <View style={styles.flex}>
                <Text style={styles.greeting}>{greetingForNow()},</Text>
                <Text style={styles.name}>{profile?.name || "there"}</Text>
              </View>
              <Pressable
                style={styles.avatar}
                onPress={() => navigation.navigate("Settings")}
                accessibilityLabel="Settings"
              >
                <Text style={styles.avatarText}>{initial}</Text>
              </Pressable>
            </View>

            {/* Date nav */}
            <View style={styles.datePill}>
              <Pressable
                onPress={() => selectDate(addDays(selectedDate, -1))}
                hitSlop={10}
              >
                <Ionicons name="chevron-back" size={18} color={colors.faint} />
              </Pressable>
              <Text style={styles.dateLabel}>{formatDateLabel(selectedDate)}</Text>
              <Pressable
                onPress={() => !atToday && selectDate(addDays(selectedDate, 1))}
                disabled={atToday}
                hitSlop={10}
              >
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={atToday ? colors.track : colors.faint}
                />
              </Pressable>
            </View>

            {/* Ring card */}
            <View style={styles.ringCard}>
              <View>
                <CalorieRing target={target} consumed={consumed} />
                {showInitialLoading && (
                  <View style={styles.ringLoading} pointerEvents="none">
                    <ActivityIndicator color={colors.primary} />
                  </View>
                )}
              </View>
              <View style={styles.statsRow}>
                <Stat value={consumed} label="Eaten" color={colors.success} />
                <Stat value={target} label="Target" color={colors.primary} />
                <Stat
                  value={`${pct}%`}
                  label="of budget"
                  color={remaining < 0 ? colors.danger : colors.text}
                />
              </View>
            </View>

            {/* Log heading */}
            <View style={styles.logHead}>
              <Text style={styles.logTitle}>
                {atToday ? "Today's log" : "Log"}
              </Text>
              <Text style={styles.logCount}>{entries.length} items</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <LogItem entry={item} onDelete={atToday ? onDelete : undefined} />
        )}
        ListEmptyComponent={
          showInitialLoading ? null : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>🍽️</Text>
              <Text style={styles.emptyTitle}>No food logged yet</Text>
              <Text style={styles.emptyText}>
                {atToday
                  ? "Tap the camera below to scan your first meal."
                  : "Nothing was logged on this day."}
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

function Stat({
  value,
  label,
  color,
}: {
  value: number | string;
  label: string;
  color: string;
}) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>
        {typeof value === "number" ? value.toLocaleString("en-US") : value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  listContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: 120 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: spacing.md },
  greeting: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.muted },
  name: { fontFamily: fonts.black, fontSize: 22, color: colors.text, letterSpacing: -0.4 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.tint,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  avatarText: { fontFamily: fonts.black, fontSize: 18, color: colors.primary },
  datePill: {
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: spacing.md,
  },
  dateLabel: { fontFamily: fonts.heavy, fontSize: 14, color: colors.text },
  ringCard: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md + 6,
    alignItems: "center",
    ...shadow.card,
  },
  ringLoading: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    paddingBottom: spacing.lg,
  },
  statsRow: { flexDirection: "row", width: "100%", gap: spacing.sm + 2, marginTop: spacing.md },
  stat: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.sm + 4,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
  },
  statValue: { fontFamily: fonts.black, fontSize: 19 },
  statLabel: { fontFamily: fonts.bold, fontSize: 12, color: colors.muted, marginTop: 1 },
  logHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.lg,
    marginBottom: spacing.md - 2,
    paddingHorizontal: 2,
  },
  logTitle: { fontFamily: fonts.black, fontSize: 18, color: colors.text },
  logCount: { fontFamily: fonts.bold, fontSize: 13, color: colors.muted },
  emptyCard: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  emptyEmoji: { fontSize: 40, marginBottom: spacing.sm },
  emptyTitle: { fontFamily: fonts.heavy, fontSize: 16, color: colors.text },
  emptyText: {
    fontFamily: fonts.bodySemibold,
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
    marginTop: spacing.xs,
  },
});
