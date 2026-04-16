import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProviders } from "@/src/providers/AppProviders";
import { COLORS } from "@/src/ui/theme/colors";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.secondaryBg },
        headerTintColor: COLORS.textPrimary,
        headerTitleStyle: {
          fontFamily: "Inter_600SemiBold",
          fontSize: 16,
          color: COLORS.accent,
        },
        contentStyle: { backgroundColor: COLORS.primaryBg },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="chat"
        options={{
          title: "الحسن",
          headerBackTitle: "رجوع",
        }}
      />
      <Stack.Screen
        name="settings"
        options={{ title: "الإعدادات", headerBackTitle: "رجوع" }}
      />
      <Stack.Screen
        name="memory"
        options={{ title: "الذاكرة", headerBackTitle: "رجوع" }}
      />
      <Stack.Screen
        name="tools"
        options={{ title: "الأدوات", headerBackTitle: "رجوع" }}
      />
      <Stack.Screen
        name="onboarding"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <AppProviders>
                <RootLayoutNav />
              </AppProviders>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
