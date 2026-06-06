import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { AuthScreen } from "../screens/AuthScreen";
import { OnboardingScreen } from "../screens/OnboardingScreen";
import { DashboardScreen } from "../screens/DashboardScreen";
import { CameraScreen } from "../screens/CameraScreen";
import { useAuthStore } from "../store/useAuthStore";
import { useCalorieStore } from "../store/useCalorieStore";
import { colors } from "../theme";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

function Splash() {
  return (
    <View style={styles.splash}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export function RootNavigator() {
  const initAuth = useAuthStore((s) => s.init);
  const session = useAuthStore((s) => s.session);
  const authInitialized = useAuthStore((s) => s.initialized);

  const loadProfile = useCalorieStore((s) => s.loadProfile);
  const resetCalories = useCalorieStore((s) => s.reset);
  const profile = useCalorieStore((s) => s.profile);
  const profileLoaded = useCalorieStore((s) => s.profileLoaded);

  // Subscribe to auth once.
  useEffect(() => initAuth(), [initAuth]);

  // When the session appears, load the profile; when it clears, reset.
  useEffect(() => {
    if (session) {
      loadProfile();
    } else {
      resetCalories();
    }
  }, [session, loadProfile, resetCalories]);

  if (!authInitialized) return <Splash />;

  let content: React.ReactNode;
  if (!session) {
    content = <Stack.Screen name="Auth" component={AuthScreen} />;
  } else if (!profileLoaded) {
    // Block until we know whether a profile exists (PRD §1.2 onboarding gate).
    return <Splash />;
  } else if (!profile) {
    content = <Stack.Screen name="Onboarding" component={OnboardingScreen} />;
  } else {
    content = (
      <>
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen
          name="Camera"
          component={CameraScreen}
          options={{ presentation: "fullScreenModal" }}
        />
      </>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {content}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
});
