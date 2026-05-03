// ============================================================
// Command Center Dashboard — المركز القيادي لـ Al-Hassan V2
// Dark Tech · Glassmorphism · Aiden v3.18.0 · Real-time
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  Dimensions,
  RefreshControl,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "@/src/ui/theme/colors";
import { SPACING, RADIUS } from "@/src/ui/theme/spacing";
import { STORAGE_KEYS } from "@/src/constants/storage-keys";
import { AIDEN_DEFAULT_URL } from "@/src/config/aiden.config";
import {
  fetchSecuritySnapshot,
  SecuritySnapshot,
  getSignalColor,
  getCpuColor,
} from "@/src/services/security.service";
import { useWebSocket } from "@/src/providers/WebSocketProvider";
import { useSettingsStore } from "@/src/store/settings.store";

const { width: SCREEN_W } = Dimensions.get("window");

// ── Animated pulsing dot ─────────────────────────────────────

function PulseDot({ color, size = 8 }: { color: string; size?: number }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.2, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);
  return (
    <View style={{ width: size, height: size, position: "relative", alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={{
          position: "absolute",
          width: size * 2.5,
          height: size * 2.5,
          borderRadius: size * 1.25,
          backgroundColor: color,
          opacity: pulse,
        }}
      />
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />
    </View>
  );
}

// ── Glass metric card ────────────────────────────────────────

function MetricTile({
  icon,
  label,
  value,
  unit,
  color,
  progress,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  unit?: string;
  color: string;
  progress?: number | null;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (progress !== undefined && progress !== null) {
      Animated.timing(anim, { toValue: Math.min(progress, 100), duration: 800, useNativeDriver: false }).start();
    }
  }, [progress, anim]);

  return (
    <View style={[mStyles.tile, { borderColor: color + "30" }]}>
      <LinearGradient
        colors={[color + "18", color + "06", "transparent"]}
        style={mStyles.tileGrad}
      >
        <View style={mStyles.tileTop}>
          <View style={[mStyles.tileIcon, { backgroundColor: color + "22" }]}>
            <Feather name={icon} size={13} color={color} />
          </View>
          <Text style={mStyles.tileLabel}>{label}</Text>
        </View>
        <Text style={[mStyles.tileValue, { color }]}>
          {value}
          {unit && <Text style={mStyles.tileUnit}> {unit}</Text>}
        </Text>
        {progress !== undefined && (
          <View style={mStyles.bar}>
            <Animated.View
              style={[
                mStyles.barFill,
                {
                  backgroundColor: color,
                  width: anim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }),
                },
              ]}
            />
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const mStyles = StyleSheet.create({
  tile: {
    flex: 1,
    borderRadius: RADIUS.md,
    overflow: "hidden",
    borderWidth: 1,
    backgroundColor: COLORS.glassCard,
  },
  tileGrad: { padding: SPACING.md, gap: 6 },
  tileTop: { flexDirection: "row", alignItems: "center", gap: 6 },
  tileIcon: { width: 22, height: 22, borderRadius: RADIUS.sm, alignItems: "center", justifyContent: "center" },
  tileLabel: { fontSize: 9, color: COLORS.textMuted, fontWeight: "700" as const, textTransform: "uppercase" as const, letterSpacing: 0.8 },
  tileValue: { fontSize: 20, fontWeight: "800" as const, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", lineHeight: 24 },
  tileUnit: { fontSize: 10, fontWeight: "400" as const },
  bar: { height: 3, backgroundColor: COLORS.border, borderRadius: 2, overflow: "hidden", marginTop: 2 },
  barFill: { height: "100%", borderRadius: 2 },
});

// ── Feature card ─────────────────────────────────────────────

function FeatureCard({
  icon,
  title,
  subtitle,
  color,
  route,
  badge,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  color: string;
  route: string;
  badge?: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View style={[fStyles.wrapper, { transform: [{ scale }] }]}>
      <TouchableOpacity
        style={[fStyles.card, { borderColor: color + "33" }]}
        onPress={() => router.push(route as any)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        <LinearGradient
          colors={[color + "20", color + "08", "transparent"]}
          style={fStyles.cardGrad}
        >
          <View style={[fStyles.iconRing, { backgroundColor: color + "22", borderColor: color + "44" }]}>
            <Feather name={icon} size={22} color={color} />
          </View>
          {badge && (
            <View style={[fStyles.badge, { backgroundColor: color }]}>
              <Text style={fStyles.badgeText}>{badge}</Text>
            </View>
          )}
          <Text style={fStyles.title}>{title}</Text>
          <Text style={fStyles.subtitle} numberOfLines={2}>{subtitle}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const fStyles = StyleSheet.create({
  wrapper: { flex: 1 },
  card: {
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    borderWidth: 1,
    backgroundColor: COLORS.glassCard,
    minHeight: 120,
  },
  cardGrad: {
    padding: SPACING.md,
    gap: 6,
    minHeight: 120,
  },
  iconRing: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 2,
  },
  badge: {
    position: "absolute" as const,
    top: SPACING.md,
    right: SPACING.md,
    borderRadius: RADIUS.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 9, color: "#fff", fontWeight: "800" as const },
  title: { fontSize: 13, color: COLORS.textPrimary, fontWeight: "700" as const },
  subtitle: { fontSize: 10, color: COLORS.textMuted, lineHeight: 14 },
});

// ── Activity row ─────────────────────────────────────────────

function ActivityRow({ icon, agent, message, time }: {
  icon: string; agent: string; message: string; time: number;
}) {
  const elapsed = Math.round((Date.now() - time) / 1000);
  const timeLabel = elapsed < 60 ? `${elapsed}ث` : `${Math.round(elapsed / 60)}د`;
  return (
    <View style={aStyles.row}>
      <View style={aStyles.iconWrap}>
        <Feather name={icon as any} size={12} color={COLORS.accent} />
      </View>
      <View style={aStyles.info}>
        <Text style={aStyles.agent}>{agent}</Text>
        <Text style={aStyles.msg} numberOfLines={1}>{message}</Text>
      </View>
      <Text style={aStyles.time}>{timeLabel}</Text>
    </View>
  );
}

const aStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.accentGlow,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1 },
  agent: { fontSize: 10, color: COLORS.accent, fontWeight: "700" as const },
  msg: { fontSize: 12, color: COLORS.textSecondary },
  time: { fontSize: 9, color: COLORS.textMuted },
});

// ── Main Dashboard ────────────────────────────────────────────

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { settings } = useSettingsStore();
  const { wsStatus, recentActivity, latencyMs, reconnect } = useWebSocket();
  const [serverUrl, setServerUrl] = useState(AIDEN_DEFAULT_URL);
  const [snapshot, setSnapshot] = useState<SecuritySnapshot | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const wsConnected = wsStatus === "connected";
  const wsColor = wsStatus === "connected" ? COLORS.neonGreen
    : wsStatus === "connecting" ? COLORS.neonYellow
    : COLORS.neonRed;
  const wsLabel = wsStatus === "connected" ? "متصل"
    : wsStatus === "connecting" ? "يتصل..."
    : "غير متصل";

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.AIDEN_SERVER_URL).then((v) => {
      if (v) setServerUrl(v);
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadMetrics = useCallback(async () => {
    if (!wsConnected) return;
    try {
      const snap = await fetchSecuritySnapshot(serverUrl);
      setSnapshot(snap);
    } catch { /* offline */ }
  }, [serverUrl, wsConnected]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMetrics();
    setRefreshing(false);
  }, [loadMetrics]);

  useEffect(() => {
    if (wsConnected) loadMetrics();
    const interval = setInterval(() => { if (wsConnected) loadMetrics(); }, 30000);
    return () => clearInterval(interval);
  }, [wsConnected, loadMetrics]);

  const cpuColor = getCpuColor(snapshot?.cpuUsage ?? null);
  const ramPct = snapshot?.ramUsage && snapshot?.ramTotal
    ? (snapshot.ramUsage / snapshot.ramTotal) * 100
    : null;
  const ramColor = getCpuColor(ramPct);
  const wifiColor = getSignalColor(snapshot?.wifiSignal ?? null);

  const hour = currentTime.getHours();
  const greeting = hour < 5 ? "ليلة طيبة" : hour < 12 ? "صباح الخير" : hour < 17 ? "مساء الخير" : hour < 21 ? "مساء النور" : "ليلة طيبة";
  const userName = settings?.userName ?? "القائد";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient
        colors={["#0D1220", "#0B0F1A"]}
        style={styles.header}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>{greeting}،</Text>
          <Text style={styles.userName}>{userName}</Text>
        </View>

        <View style={styles.headerCenter}>
          <View style={styles.logoRing}>
            <Text style={styles.logoText}>ح</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.wsChip, { borderColor: wsColor + "44", backgroundColor: wsColor + "12" }]}
            onPress={wsConnected ? undefined : reconnect}
            activeOpacity={0.7}
          >
            <PulseDot color={wsColor} size={6} />
            <Text style={[styles.wsLabel, { color: wsColor }]}>{wsLabel}</Text>
          </TouchableOpacity>
          {latencyMs !== null && wsConnected && (
            <Text style={styles.latency}>{latencyMs}ms</Text>
          )}
        </View>
      </LinearGradient>

      {/* Time strip */}
      <View style={styles.timeStrip}>
        <Text style={styles.timeText}>
          {currentTime.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
        </Text>
        <View style={styles.timeDivider} />
        <Text style={styles.dateText}>
          {currentTime.toLocaleDateString("ar-SA", { weekday: "short", month: "short", day: "numeric" })}
        </Text>
        <View style={{ flex: 1 }} />
        <Text style={styles.versionText}>Aiden v3.18.0 · 62 مهارة</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />
        }
      >

        {/* ── Aiden Status Banner ── */}
        <LinearGradient
          colors={
            wsConnected
              ? [COLORS.neonGreen + "18", COLORS.neonCyan + "08", "transparent"]
              : [COLORS.neonRed + "14", "transparent"]
          }
          style={[styles.aidenBanner, { borderColor: wsColor + "33" }]}
        >
          <View style={[styles.aidenIconWrap, { backgroundColor: wsColor + "22" }]}>
            <Feather name="cpu" size={18} color={wsColor} />
          </View>
          <View style={styles.aidenInfo}>
            <Text style={[styles.aidenTitle, { color: wsColor }]}>
              {wsConnected ? "Aiden متصل ويعمل" : "Aiden غير متصل"}
            </Text>
            <Text style={styles.aidenSub}>
              {wsConnected
                ? `${serverUrl.replace("http://", "")} · ${latencyMs !== null ? `${latencyMs}ms` : "جاري القياس..."}`
                : "تأكد من تشغيل Aiden على Kali Linux"}
            </Text>
          </View>
          {!wsConnected && (
            <TouchableOpacity
              style={[styles.reconnectBtn, { borderColor: wsColor + "44" }]}
              onPress={reconnect}
              activeOpacity={0.7}
            >
              <Feather name="refresh-cw" size={13} color={wsColor} />
            </TouchableOpacity>
          )}
        </LinearGradient>

        {/* ── Live Metrics ── */}
        {wsConnected && (
          <>
            <Text style={styles.sectionTitle}>مقاييس النظام الحية</Text>
            <View style={styles.metricsRow}>
              <MetricTile
                icon="cpu"
                label="CPU"
                value={snapshot?.cpuUsage !== null && snapshot?.cpuUsage !== undefined ? `${Math.round(snapshot.cpuUsage)}` : "—"}
                unit="%"
                color={cpuColor}
                progress={snapshot?.cpuUsage ?? null}
              />
              <View style={{ width: SPACING.sm }} />
              <MetricTile
                icon="server"
                label="RAM"
                value={ramPct !== null ? `${Math.round(ramPct)}` : "—"}
                unit="%"
                color={ramColor}
                progress={ramPct}
              />
              <View style={{ width: SPACING.sm }} />
              <MetricTile
                icon="wifi"
                label="WiFi"
                value={
                  snapshot?.wifiSignal !== null && snapshot?.wifiSignal !== undefined
                    ? `${snapshot.wifiSignal}`
                    : "—"
                }
                unit="dBm"
                color={wifiColor}
              />
            </View>
          </>
        )}

        {/* ── Command Center Grid ── */}
        <Text style={styles.sectionTitle}>مركز القيادة</Text>
        <View style={styles.featureGrid}>
          <FeatureCard
            icon="shield"
            title="Security Dashboard"
            subtitle="مراقبة الشبكة · CPU/RAM · التهديدات"
            color={COLORS.neonRed}
            route="/security"
          />
          <View style={{ width: SPACING.sm }} />
          <FeatureCard
            icon="tool"
            title="Tactical Toolbox"
            subtitle="62 مهارة أمنية جاهزة للتنفيذ"
            color={COLORS.neonBlue}
            route="/tactical"
            badge="62"
          />
        </View>
        <View style={[styles.featureGrid, { marginTop: SPACING.sm }]}>
          <FeatureCard
            icon="eye"
            title="Vision Intelligence"
            subtitle="تحليل بصري للأخطاء والكود"
            color={COLORS.neonGreen}
            route="/vision"
          />
          <View style={{ width: SPACING.sm }} />
          <FeatureCard
            icon="book"
            title="Knowledge Vault"
            subtitle="LESSONS.md · ملف المستخدم"
            color={COLORS.neonPurple}
            route="/knowledge"
          />
        </View>

        {/* ── Quick Chat CTA ── */}
        <TouchableOpacity
          style={styles.chatCta}
          onPress={() => router.push("/chat" as any)}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[COLORS.accent + "CC", COLORS.accentDark + "CC"]}
            style={styles.chatCtaGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Feather name="message-circle" size={22} color={COLORS.primaryBg} />
            <View style={{ flex: 1 }}>
              <Text style={styles.chatCtaTitle}>محادثة مع الحسن</Text>
              <Text style={styles.chatCtaSub}>اسأل · أوامر صوتية · Aiden AI</Text>
            </View>
            <Feather name="arrow-left" size={18} color={COLORS.primaryBg} />
          </LinearGradient>
        </TouchableOpacity>

        {/* ── Recent Activity ── */}
        {recentActivity.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>نشاط Aiden الأخير</Text>
            <View style={styles.activityCard}>
              {recentActivity.map((a) => (
                <ActivityRow
                  key={a.id}
                  icon={a.icon}
                  agent={a.agent}
                  message={a.message}
                  time={a.timestamp}
                />
              ))}
            </View>
          </>
        )}

        {/* ── Offline hint ── */}
        {!wsConnected && (
          <View style={styles.offlineHint}>
            <Feather name="terminal" size={28} color={COLORS.textMuted} />
            <Text style={styles.offlineTitle}>ابدأ Aiden على Kali Linux</Text>
            <Text style={styles.offlineCmd}>python3 aiden.py --port 4200</Text>
            <Text style={styles.offlineSub}>
              ثم تأكد من اتصال الجهازين بنفس الشبكة أو عبر USB Tethering
            </Text>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primaryBg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  headerLeft: { flex: 1 },
  greeting: { fontSize: 11, color: COLORS.textMuted },
  userName: { fontSize: 16, color: COLORS.textPrimary, fontWeight: "700" as const },
  headerCenter: { alignItems: "center" },
  logoRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  logoText: { fontSize: 22, color: COLORS.primaryBg, fontWeight: "800" as const },
  headerRight: { flex: 1, alignItems: "flex-end", gap: 2 },
  wsChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  wsLabel: { fontSize: 10, fontWeight: "700" as const },
  latency: { fontSize: 9, color: COLORS.textMuted },
  timeStrip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.secondaryBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
    gap: SPACING.sm,
  },
  timeText: { fontSize: 13, color: COLORS.textPrimary, fontWeight: "700" as const, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
  timeDivider: { width: 1, height: 12, backgroundColor: COLORS.border },
  dateText: { fontSize: 11, color: COLORS.textSecondary },
  versionText: { fontSize: 9, color: COLORS.textMuted },
  scroll: { flex: 1 },
  content: { padding: SPACING.lg, gap: SPACING.md },
  sectionTitle: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: "700" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 1.2,
    marginTop: SPACING.xs,
  },
  aidenBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
  },
  aidenIconWrap: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
  },
  aidenInfo: { flex: 1 },
  aidenTitle: { fontSize: 14, fontWeight: "700" as const },
  aidenSub: { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },
  reconnectBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  metricsRow: { flexDirection: "row" },
  featureGrid: { flexDirection: "row" },
  chatCta: {
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  chatCtaGrad: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  chatCtaTitle: { fontSize: 15, color: COLORS.primaryBg, fontWeight: "800" as const },
  chatCtaSub: { fontSize: 11, color: COLORS.primaryBg + "CC" },
  activityCard: {
    backgroundColor: COLORS.glassCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  offlineHint: {
    alignItems: "center",
    gap: SPACING.sm,
    padding: SPACING.xxl,
    backgroundColor: COLORS.glassCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  offlineTitle: { fontSize: 14, color: COLORS.textSecondary, fontWeight: "700" as const, textAlign: "center" },
  offlineCmd: {
    fontSize: 13,
    color: COLORS.neonGreen,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    backgroundColor: "#0a0f0a",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  offlineSub: { fontSize: 11, color: COLORS.textMuted, textAlign: "center", lineHeight: 18 },
});
