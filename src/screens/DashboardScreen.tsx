import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { QuickActionTile } from "../components/QuickActionTile";
import { useCalorieStore } from "../store/useCalorieStore";
import { colors, radius, spacing } from "../theme";
import type { MainTabScreenProps } from "../navigation/types";

type Props = MainTabScreenProps<"Dashboard">;

function greetingForNow(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardScreen({ navigation }: Props) {
  const { profile, log } = useCalorieStore();

  const target = log?.total_target ?? profile?.daily_calorie_target ?? 0;
  const consumed = log?.total_consumed ?? 0;
  const remaining = target - consumed;

  const goToLog = () => navigation.navigate("Log");

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Greeting */}
        <View style={styles.greetRow}>
          <View style={styles.flex}>
            <Text style={styles.greeting}>
              {greetingForNow()}
              {profile?.name ? `, ${profile.name}` : ""} 👋
            </Text>
            <Text style={styles.subtitle}>Quickly log, scan, and track your day.</Text>
          </View>
        </View>

        {/* Scan CTA card */}
        <Pressable
          style={({ pressed }) => [styles.scanCard, pressed && styles.pressed]}
          onPress={() => navigation.navigate("Camera")}
        >
          <View style={styles.flex}>
            <Text style={styles.scanTitle}>Scan a meal</Text>
            <Text style={styles.scanText}>
              Point your camera at your food for an instant calorie estimate.
            </Text>
            <View style={styles.scanBtn}>
              <Ionicons name="camera" size={18} color={colors.white} />
              <Text style={styles.scanBtnText}>Scan now</Text>
            </View>
          </View>
          <View style={styles.scanIconWrap}>
            <Ionicons name="restaurant" size={40} color={colors.primaryDark} />
          </View>
        </Pressable>

        {/* Quick actions */}
        <Text style={styles.sectionTitle}>Quick actions</Text>
        <View style={styles.grid}>
          <View style={styles.gridRow}>
            <QuickActionTile
              icon="flame"
              label="Calories In"
              value={`${consumed}`}
              caption="kcal eaten"
              onPress={goToLog}
            />
            <QuickActionTile
              icon="pie-chart"
              label="Remaining"
              value={`${remaining}`}
              caption={remaining < 0 ? "kcal over" : "kcal left"}
              tint={remaining < 0 ? "#F6DCDC" : colors.tint}
              onPress={goToLog}
            />
          </View>
          <View style={styles.gridRow}>
            <QuickActionTile
              icon="flag"
              label="Target"
              value={`${target}`}
              caption="daily goal"
              onPress={goToLog}
            />
            <QuickActionTile
              icon="walk"
              label="Steps"
              value="—"
              caption="Coming soon"
              disabled
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  greetRow: { marginBottom: spacing.lg },
  greeting: { fontSize: 26, fontWeight: "800", color: colors.text },
  subtitle: { fontSize: 15, color: colors.muted, marginTop: spacing.xs },
  scanCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  scanTitle: { fontSize: 18, fontWeight: "800", color: colors.text },
  scanText: { fontSize: 14, color: colors.muted, marginTop: spacing.xs, lineHeight: 19 },
  scanBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  scanBtnText: { color: colors.white, fontWeight: "700", fontSize: 14 },
  scanIconWrap: {
    width: 76,
    height: 76,
    borderRadius: radius.lg,
    backgroundColor: colors.tint,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.md,
  },
  grid: { gap: spacing.md },
  gridRow: { flexDirection: "row", gap: spacing.md },
  pressed: { opacity: 0.85 },
});
