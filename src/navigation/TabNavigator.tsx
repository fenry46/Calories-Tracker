import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { HomeScreen } from "../screens/HomeScreen";
import { HistoryScreen } from "../screens/HistoryScreen";
import { colors, fonts, radius, shadow, spacing } from "../theme";
import type { MainTabParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: "home",
  History: "time",
};

/** Custom tab bar: Home · [camera FAB] · History, matching the NutriPen design. */
function NutriTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const renderTab = (routeName: keyof MainTabParamList, index: number) => {
    const focused = state.index === index;
    const color = focused ? colors.primary : colors.faint;
    const icon = (focused
      ? ICONS[routeName]
      : `${ICONS[routeName]}-outline`) as keyof typeof Ionicons.glyphMap;
    return (
      <Pressable
        key={routeName}
        style={styles.tab}
        onPress={() => {
          const event = navigation.emit({
            type: "tabPress",
            target: state.routes[index].key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) navigation.navigate(routeName);
        }}
        accessibilityRole="button"
        accessibilityState={{ selected: focused }}
      >
        <Ionicons name={icon} size={24} color={color} />
        <Text style={[styles.tabLabel, { color }]}>{routeName}</Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.barWrap, { paddingBottom: insets.bottom || spacing.sm }]}>
      <View style={styles.bar}>
        {renderTab("Home", 0)}
        <View style={styles.fabSlot} />
        {renderTab("History", 1)}
      </View>

      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => navigation.getParent()?.navigate("Camera")}
        accessibilityRole="button"
        accessibilityLabel="Scan a meal"
      >
        <Ionicons name="camera" size={28} color={colors.white} />
      </Pressable>
    </View>
  );
}

export function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <NutriTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
    </Tab.Navigator>
  );
}

const BAR_HEIGHT = 64;
const FAB_SIZE = 64;

const styles = StyleSheet.create({
  barWrap: {
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bar: {
    height: BAR_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
  },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4 },
  tabLabel: { fontFamily: fonts.heavy, fontSize: 11 },
  fabSlot: { width: FAB_SIZE + spacing.md },
  fab: {
    position: "absolute",
    alignSelf: "center",
    top: -FAB_SIZE / 2,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 5,
    borderColor: colors.bg,
    ...shadow.button,
  },
  fabPressed: { opacity: 0.85 },
});
