import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import { DashboardScreen } from "../screens/DashboardScreen";
import { LogScreen } from "../screens/LogScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { colors, spacing } from "../theme";
import type { MainTabParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
  Dashboard: "home",
  Log: "journal",
  Settings: "person",
};

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: spacing.sm,
          paddingTop: spacing.xs,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
        tabBarIcon: ({ color, size, focused }) => (
          <Ionicons
            name={focused ? ICONS[route.name] : (`${ICONS[route.name]}-outline` as keyof typeof Ionicons.glyphMap)}
            size={size}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Log" component={LogScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
