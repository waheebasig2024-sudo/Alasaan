// ============================================================
// Tabs Layout — نظام التنقل بالتبويبات لـ Al-Hassan V2
// Dark Tech · Glassmorphism · Cinematic UI
// ============================================================

import { Tabs } from "expo-router";
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { COLORS } from "@/src/ui/theme/colors";
import { SPACING, RADIUS } from "@/src/ui/theme/spacing";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWebSocket } from "@/src/providers/WebSocketProvider";

const { width: SCREEN_W } = Dimensions.get("window");

// ── Tab definitions ──────────────────────────────────────────

const TABS = [
  { name: "dashboard", icon: "home" as const, label: "الرئيسية" },
  { name: "chat", icon: "message-circle" as const, label: "المساعد" },
  { name: "security", icon: "shield" as const, label: "الأمان" },
  { name: "tactical", icon: "tool" as const, label: "المهارات" },
  { name: "more", icon: "grid" as const, label: "المزيد" },
];

const TAB_COLORS: Record<string, string> = {
  dashboard: COLORS.accent,
  chat: COLORS.neonGreen,
  security: COLORS.neonRed,
  tactical: COLORS.neonBlue,
  more: COLORS.neonPurple,
};

// ── Custom Tab Bar ────────────────────────────────────────────

function CinematicTabBar({ state, navigation }: { state: any; navigation: any; descriptors?: any }) {
  const insets = useSafeAreaInsets();
  const { wsStatus } = useWebSocket();
  const wsConnected = wsStatus === "connected";

  return (
    <View style={[styles.tabBarWrapper, { paddingBottom: insets.bottom > 0 ? insets.bottom : SPACING.sm }]}>
      {/* Glassmorphism border top */}
      <View style={styles.tabBarBorderTop} />
      <View style={styles.tabBar}>
        {TABS.map((tab, index) => {
          const isFocused = state.index === index;
          const color = isFocused ? TAB_COLORS[tab.name] : COLORS.textMuted;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: state.routes[index]?.key ?? tab.name,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(state.routes[index]?.name ?? tab.name);
            }
          };

          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tabItem}
              onPress={onPress}
              activeOpacity={0.7}
            >
              {/* Active indicator glow */}
              {isFocused && (
                <View style={[styles.activeGlow, { backgroundColor: color + "18" }]} />
              )}

              {/* Icon + WS dot for dashboard */}
              <View style={styles.iconWrap}>
                <Feather name={tab.icon} size={20} color={color} />
                {tab.name === "dashboard" && (
                  <View
                    style={[
                      styles.wsDot,
                      { backgroundColor: wsConnected ? COLORS.neonGreen : COLORS.error },
                    ]}
                  />
                )}
              </View>

              {/* Label */}
              <Text style={[styles.tabLabel, { color }]}>{tab.label}</Text>

              {/* Active underline */}
              {isFocused && (
                <View style={[styles.activeBar, { backgroundColor: color }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    backgroundColor: COLORS.primaryBg,
    borderTopWidth: 0,
  },
  tabBarBorderTop: {
    height: 1,
    backgroundColor: COLORS.glassBorder,
    marginHorizontal: SPACING.lg,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: COLORS.primaryBg,
    paddingTop: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.sm,
    gap: 2,
    borderRadius: RADIUS.md,
    overflow: "hidden",
    position: "relative",
  },
  activeGlow: {
    position: "absolute",
    inset: 0,
    borderRadius: RADIUS.md,
  },
  iconWrap: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  wsDot: {
    position: "absolute",
    top: -2,
    right: -4,
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.primaryBg,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: "700" as const,
    fontFamily: Platform.OS === "ios" ? undefined : undefined,
  },
  activeBar: {
    position: "absolute",
    bottom: 0,
    height: 2,
    width: 20,
    borderRadius: 1,
  },
});

// ── Layout ───────────────────────────────────────────────────

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CinematicTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: "shift",
      }}
    >
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="security" />
      <Tabs.Screen name="tactical" />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}
