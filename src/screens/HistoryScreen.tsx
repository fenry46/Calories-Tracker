import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { supabase } from "../lib/supabase";
import { useCalorieStore } from "../store/useCalorieStore";
import type { DailyLog } from "../types/models";
import { formatDateLabel, localDateISO } from "../utils/date";
import { colors, fonts, radius, shadow, spacing } from "../theme";
import type { MainTabScreenProps } from "../navigation/types";

type Props = MainTabScreenProps<"History">;

export function HistoryScreen({ navigation }: Props) {
  const profile = useCalorieStore((s) => s.profile);
  const selectDate = useCalorieStore((s) => s.selectDate);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("daily_logs")
      .select("*")
      .order("date", { ascending: false })
      .limit(60);
    setLogs((data ?? []).filter((l) => l.date !== localDateISO()));
    setLoaded(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const openDay = (date: string) => {
    selectDate(date);
    navigation.navigate("Home");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>Your past days at a glance.</Text>
      </View>

      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const consumed = item.total_consumed;
          const target = item.total_target;
          const remaining = target - consumed;
          const over = remaining < 0;
          const pct = target > 0 ? Math.min(consumed / target, 1) : 0;
          return (
            <Pressable
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              onPress={() => openDay(item.date)}
            >
              <View style={styles.rowTop}>
                <Text style={styles.date}>{formatDateLabel(item.date)}</Text>
                <View style={styles.kcalWrap}>
                  <Text style={styles.consumed}>
                    {consumed.toLocaleString("en-US")}
                  </Text>
                  <Text style={styles.ofTarget}>
                    {" "}/ {target.toLocaleString("en-US")} kcal
                  </Text>
                </View>
              </View>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    { width: `${pct * 100}%`, backgroundColor: over ? colors.danger : colors.success },
                  ]}
                />
              </View>
              <Text style={[styles.tag, over ? styles.tagOver : styles.tagOk]}>
                {over
                  ? `${Math.abs(remaining).toLocaleString("en-US")} over budget`
                  : `${remaining.toLocaleString("en-US")} under budget`}
              </Text>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          loaded ? (
            <View style={styles.empty}>
              <Ionicons name="time-outline" size={40} color={colors.faint} />
              <Text style={styles.emptyTitle}>No past days yet</Text>
              <Text style={styles.emptyText}>
                Once you log meals across days, they'll show up here.
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm },
  title: { fontFamily: fonts.black, fontSize: 26, color: colors.text, letterSpacing: -0.5 },
  subtitle: { fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.muted, marginTop: 2 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: 120 },
  row: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md - 2,
    ...shadow.card,
  },
  pressed: { opacity: 0.85 },
  rowTop: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  date: { fontFamily: fonts.heavy, fontSize: 16, color: colors.text },
  kcalWrap: { flexDirection: "row", alignItems: "baseline" },
  consumed: { fontFamily: fonts.black, fontSize: 16, color: colors.text },
  ofTarget: { fontFamily: fonts.bold, fontSize: 12, color: colors.faint },
  track: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.track,
    marginTop: spacing.sm + 2,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: radius.pill },
  tag: { fontFamily: fonts.bold, fontSize: 12, marginTop: spacing.sm },
  tagOk: { color: colors.success },
  tagOver: { color: colors.danger },
  empty: { alignItems: "center", paddingTop: spacing.xl * 2, gap: spacing.sm },
  emptyTitle: { fontFamily: fonts.heavy, fontSize: 16, color: colors.text },
  emptyText: {
    fontFamily: fonts.bodySemibold,
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
});
