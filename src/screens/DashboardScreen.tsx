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
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { CalorieRing } from "../components/CalorieRing";
import { LogItem } from "../components/LogItem";
import { useCalorieStore } from "../store/useCalorieStore";
import { useAuthStore } from "../store/useAuthStore";
import type { FoodEntry } from "../types/models";
import { addDays, formatDateLabel, isToday, localDateISO } from "../utils/date";
import { colors, radius, spacing } from "../theme";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Dashboard">;

export function DashboardScreen({ navigation }: Props) {
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
  const signOut = useAuthStore((s) => s.signOut);

  const target = log?.total_target ?? profile?.daily_calorie_target ?? 0;
  const consumed = log?.total_consumed ?? 0;
  const remaining = target - consumed;
  const atToday = isToday(selectedDate);
  const percentOfTarget = target > 0 ? Math.round((consumed / target) * 100) : 0;
  // Only block the list with a spinner on a "cold" load (no data yet); on
  // subsequent date changes we keep the existing content and use pull-to-refresh.
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

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header: date navigation + sign out */}
      <View style={styles.header}>
        <Pressable
          onPress={() => selectDate(addDays(selectedDate, -1))}
          hitSlop={10}
          style={styles.navArrow}
        >
          <Text style={styles.navArrowText}>‹</Text>
        </Pressable>
        <Text style={styles.dateLabel}>{formatDateLabel(selectedDate)}</Text>
        <Pressable
          onPress={() => !atToday && selectDate(addDays(selectedDate, 1))}
          disabled={atToday}
          hitSlop={10}
          style={styles.navArrow}
        >
          <Text style={[styles.navArrowText, atToday && styles.disabledText]}>›</Text>
        </Pressable>
      </View>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
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
            <View style={styles.ringWrap}>
              <CalorieRing target={target} consumed={consumed} />
              {showInitialLoading && (
                <View style={styles.ringLoading} pointerEvents="none">
                  <ActivityIndicator color={colors.primary} />
                </View>
              )}
            </View>

            <View style={styles.statsRow}>
              <Stat label="Target" value={target} />
              <Stat label="Consumed" value={consumed} />
              <Stat
                label="Remaining"
                value={remaining}
                color={remaining < 0 ? colors.danger : colors.primary}
              />
            </View>

            {target > 0 && (
              <Text style={styles.percentLabel}>
                {percentOfTarget}% of target
              </Text>
            )}

            <Text style={styles.sectionTitle}>Food log</Text>
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
                  ? "Tap the camera to scan your first meal."
                  : "Nothing was logged on this day."}
              </Text>
            </View>
          )
        }
      />

      {/* Sign out (small, top-right overlay) */}
      <Pressable style={styles.signOut} onPress={signOut} hitSlop={8}>
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>

      {/* FAB -> camera */}
      {atToday && (
        <Pressable
          style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
          onPress={() => navigation.navigate("Camera")}
          accessibilityLabel="Scan food"
        >
          <Text style={styles.fabText}>＋</Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

function Stat({
  label,
  value,
  color = colors.text,
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    gap: spacing.xl,
  },
  navArrow: { paddingHorizontal: spacing.md },
  navArrowText: { fontSize: 30, color: colors.primary, fontWeight: "700" },
  disabledText: { color: colors.track },
  dateLabel: { fontSize: 20, fontWeight: "700", color: colors.text, minWidth: 120, textAlign: "center" },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: 120 },
  ringWrap: { alignItems: "center", marginVertical: spacing.lg },
  ringLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  stat: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 13, color: colors.muted, marginTop: 2 },
  percentLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.muted,
    textAlign: "center",
    marginTop: -spacing.sm,
    marginBottom: spacing.lg,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: spacing.md },
  emptyCard: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  emptyEmoji: { fontSize: 40, marginBottom: spacing.sm },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  emptyText: {
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
    marginTop: spacing.xs,
  },
  signOut: { position: "absolute", top: spacing.md, right: spacing.lg },
  signOutText: { color: colors.muted, fontWeight: "600" },
  fab: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.xl,
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  fabText: { color: colors.white, fontSize: 32, fontWeight: "800", lineHeight: 34 },
  pressed: { opacity: 0.7 },
});
