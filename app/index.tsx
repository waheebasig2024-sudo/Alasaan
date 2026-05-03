// ============================================================
// Index — نقطة البداية لـ Al-Hassan V2
// يتحقق من الإعداد الأولي ثم ينتقل لمركز القيادة
// ============================================================

import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from "react-native";
import { router } from "expo-router";
import { useSettingsStore } from "@/src/store/settings.store";
import { COLORS } from "@/src/ui/theme/colors";
import { SPACING } from "@/src/ui/theme/spacing";

export default function IndexScreen() {
  const { settings, isLoaded } = useSettingsStore();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  // Entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  // Navigate after settings load
  useEffect(() => {
    if (!isLoaded) return;
    const timer = setTimeout(() => {
      if (!settings.onboardingComplete) {
        router.replace("/onboarding");
      } else {
        router.replace("/dashboard");
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [isLoaded, settings.onboardingComplete]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.logoWrap, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}
      >
        {/* Outer glow ring */}
        <View style={styles.glowOuter} />
        <View style={styles.glowMiddle} />
        <View style={styles.logoRing}>
          <Text style={styles.logoChar}>ح</Text>
        </View>
      </Animated.View>

      <Animated.View style={[styles.textWrap, { opacity: fadeAnim }]}>
        <Text style={styles.appName}>الحسن</Text>
        <Text style={styles.tagline}>مساعدك الذكي الشخصي</Text>
      </Animated.View>

      {isLoaded ? null : (
        <Animated.View style={[styles.loaderWrap, { opacity: fadeAnim }]}>
          <ActivityIndicator color={COLORS.accent} size="small" />
        </Animated.View>
      )}

      <Animated.Text style={[styles.poweredBy, { opacity: fadeAnim }]}>
        Powered by Aiden v3.18.0
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBg,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xl,
  },
  logoWrap: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    width: 120,
    height: 120,
  },
  glowOuter: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.accent + "10",
  },
  glowMiddle: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.accent + "18",
  },
  logoRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 12,
  },
  logoChar: {
    fontSize: 36,
    color: COLORS.primaryBg,
    fontWeight: "800" as const,
    fontFamily: "Inter_700Bold",
  },
  textWrap: { alignItems: "center", gap: 4 },
  appName: {
    fontSize: 32,
    color: COLORS.textPrimary,
    fontWeight: "800" as const,
    fontFamily: "Inter_700Bold",
  },
  tagline: { fontSize: 14, color: COLORS.textMuted },
  loaderWrap: { marginTop: SPACING.md },
  poweredBy: {
    position: "absolute",
    bottom: 40,
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: "Inter_400Regular",
  },
});
