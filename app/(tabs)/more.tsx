// ============================================================
// More Screen — شاشة المزيد
// Vision · Knowledge · Connection Settings · روابط سريعة
// ============================================================

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, type Href } from "expo-router";
import { COLORS } from "@/src/ui/theme/colors";
import { SPACING, RADIUS } from "@/src/ui/theme/spacing";
import { useSettingsStore } from "@/src/store/settings.store";
import { useWebSocket } from "@/src/providers/WebSocketProvider";

const ITEMS: {
  icon: keyof typeof import("@expo/vector-icons").Feather.glyphMap;
  label: string;
  sublabel: string;
  color: string;
  route: Href;
}[] = [
  {
    icon: "eye",
    label: "Vision Intelligence",
    sublabel: "تحليل بصري للأخطاء والكود",
    color: COLORS.neonGreen,
    route: "/vision",
  },
  {
    icon: "book",
    label: "Knowledge Vault",
    sublabel: "LESSONS.md · ملف المستخدم",
    color: COLORS.neonPurple,
    route: "/knowledge",
  },
  {
    icon: "database",
    label: "الذاكرة",
    sublabel: "محادثات · ملاحظات · الذكريات",
    color: COLORS.neonCyan,
    route: "/memory",
  },
  {
    icon: "cpu",
    label: "Groq AI",
    sublabel: "محادثة مباشرة مع Groq LLM",
    color: COLORS.neonOrange,
    route: "/groq-chat",
  },
  {
    icon: "tool",
    label: "أدوات النظام",
    sublabel: "اختبار جميع أدوات الحسن",
    color: COLORS.accent,
    route: "/tools",
  },
  {
    icon: "radio",
    label: "إعدادات الاتصال",
    sublabel: "IP · Ngrok · WebSocket · صوت الحسن",
    color: COLORS.neonCyan,
    route: "/connection-settings",
  },
  {
    icon: "settings",
    label: "الإعدادات",
    sublabel: "خادم Aiden · الصوت · المظهر",
    color: COLORS.textSecondary,
    route: "/settings",
  },
];

function NavItem({ item }: { item: typeof ITEMS[number] }) {
  return (
    <TouchableOpacity
      style={styles.item}
      onPress={() => router.push(item.route)}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.itemIcon,
          {
            backgroundColor: item.color + "20",
            borderColor: item.color + "33",
          },
        ]}
      >
        <Feather name={item.icon} size={20} color={item.color} />
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemLabel}>{item.label}</Text>
        <Text style={styles.itemSub}>{item.sublabel}</Text>
      </View>
      <Feather name="chevron-left" size={16} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const { settings } = useSettingsStore();
  const { wsStatus, serverUrl } = useWebSocket();

  const wsColor =
    wsStatus === "connected"
      ? COLORS.neonGreen
      : wsStatus === "connecting"
      ? COLORS.neonOrange
      : COLORS.neonRed;

  const wsLabel =
    wsStatus === "connected"
      ? "متصل"
      : wsStatus === "connecting"
      ? "جاري الاتصال..."
      : "غير متصل";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient colors={["#0D1220", "#0B0F1A"]} style={styles.header}>
        <Text style={styles.headerTitle}>المزيد</Text>
        <Text style={styles.headerSub}>الحسن · المساعد الذكي الشخصي</Text>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* User card */}
        <LinearGradient
          colors={[COLORS.accent + "22", COLORS.accentDark + "08", "transparent"]}
          style={styles.userCard}
        >
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {(settings?.userName ?? "م").charAt(0)}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{settings?.userName ?? "المستخدم"}</Text>
            <Text style={styles.userSub}>Al-Hassan V2 · Aiden v3.18.0</Text>
          </View>
        </LinearGradient>

        {/* Connection Status Banner */}
        <TouchableOpacity
          style={[styles.connectionBanner, { borderColor: wsColor + "33", backgroundColor: wsColor + "0C" }]}
          onPress={() => router.push("/connection-settings")}
          activeOpacity={0.8}
        >
          <View style={[styles.connectionDot, { backgroundColor: wsColor }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.connectionStatus, { color: wsColor }]}>{wsLabel}</Text>
            <Text style={styles.connectionUrl} numberOfLines={1}>{serverUrl}</Text>
          </View>
          <View style={styles.connectionBadge}>
            <Feather name="radio" size={13} color={wsColor} />
            <Text style={[styles.connectionBadgeText, { color: wsColor }]}>إعدادات الاتصال</Text>
          </View>
          <Feather name="chevron-left" size={14} color={wsColor} />
        </TouchableOpacity>

        {/* Navigation items */}
        <View style={styles.list}>
          {ITEMS.map((item) => (
            <NavItem key={item.label} item={item} />
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>برمجة وتطوير: وهيب عساج</Text>
          <Text style={styles.footerVersion}>الإصدار 2.0.0 · Expo SDK 54</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primaryBg },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
    alignItems: "center",
  },
  headerTitle: { fontSize: 20, color: COLORS.textPrimary, fontWeight: "800" as const },
  headerSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  scroll: { flex: 1 },
  content: { padding: SPACING.lg, gap: SPACING.lg },

  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.accent + "33",
  },
  userAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatarText: { fontSize: 22, color: COLORS.primaryBg, fontWeight: "800" as const },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, color: COLORS.textPrimary, fontWeight: "700" as const },
  userSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },

  connectionBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  connectionDot: { width: 8, height: 8, borderRadius: 4 },
  connectionStatus: { fontSize: 13, fontWeight: "700" as const },
  connectionUrl: { fontSize: 10, color: COLORS.textMuted, marginTop: 1 },
  connectionBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  connectionBadgeText: { fontSize: 11, fontWeight: "600" as const },

  list: {
    backgroundColor: COLORS.glassCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    overflow: "hidden",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  itemInfo: { flex: 1 },
  itemLabel: { fontSize: 14, color: COLORS.textPrimary, fontWeight: "600" as const },
  itemSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },

  footer: { alignItems: "center", gap: 4, paddingVertical: SPACING.xl },
  footerText: { fontSize: 12, color: COLORS.textMuted },
  footerVersion: { fontSize: 10, color: COLORS.textMuted },
});
