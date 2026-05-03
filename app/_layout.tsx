// ============================================================
// Root Layout — Al-Hassan V2
// Dark Tech · Glassmorphism · Aiden v3.18.0
// ============================================================

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
import * as Updates from "expo-updates";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProviders } from "@/src/providers/AppProviders";
import { WebSocketProvider } from "@/src/providers/WebSocketProvider";
import { COLORS } from "@/src/ui/theme/colors";
import { FloatingCommandBubble } from "@/src/ui/components/FloatingCommandBubble";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

async function checkAndApplyUpdate() {
  if (__DEV__ || Platform.OS === "web") return;
  try {
    const result = await Updates.checkForUpdateAsync();
    if (result.isAvailable) {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    }
  } catch {
    // ignore
  }
}

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
      {/* Loading / redirect screen */}
      <Stack.Screen name="index" options={{ headerShown: false }} />

      {/* ── Main Tab Navigator ── */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* ── Onboarding ── */}
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />

      {/* ── Standalone stack screens ── */}
      <Stack.Screen
        name="chat"
        options={{ title: "الحسن", headerBackTitle: "رجوع" }}
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
        name="codesign"
        options={{ title: "CoDesign", headerBackTitle: "رجوع" }}
      />
      <Stack.Screen name="offline" options={{ headerShown: false }} />
      <Stack.Screen name="offline-ai" options={{ headerShown: false }} />
      <Stack.Screen name="groq-chat" options={{ headerShown: false }} />

      {/* ── Deep-link stack screens ── */}
      <Stack.Screen name="security" options={{ headerShown: false }} />
      <Stack.Screen name="knowledge" options={{ headerShown: false }} />
      <Stack.Screen name="tactical" options={{ headerShown: false }} />
      <Stack.Screen name="vision" options={{ headerShown: false }} />
      <Stack.Screen
        name="connection-settings"
        options={{ title: "إعدادات الاتصال", headerBackTitle: "رجوع" }}
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
      checkAndApplyUpdate();
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
                <WebSocketProvider>
                  <RootLayoutNav />
                  {Platform.OS !== "web" && <FloatingCommandBubble />}
                </WebSocketProvider>
              </AppProviders>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
