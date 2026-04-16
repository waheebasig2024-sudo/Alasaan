import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useSettingsStore } from "@/src/store/settings.store";
import { COLORS } from "@/src/ui/theme/colors";
import { SPACING, RADIUS } from "@/src/ui/theme/spacing";
import { TYPOGRAPHY } from "@/src/ui/theme/typography";

export default function IndexScreen() {
  const { settings, isLoaded } = useSettingsStore();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!isLoaded) return;
    if (!settings.onboardingComplete) {
      router.replace("/onboarding");
    } else {
      router.replace("/chat");
    }
  }, [isLoaded, settings.onboardingComplete]);

  if (!isLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={COLORS.accent} size="large" />
        <Text style={styles.loadingText}>الحسن</Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: COLORS.primaryBg,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.xxl,
    color: COLORS.accent,
    fontWeight: "bold",
    fontFamily: "Inter_700Bold",
  },
});
