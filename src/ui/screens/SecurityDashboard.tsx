// ============================================================
// Security Dashboard — مركز مراقبة أمني حي
// WiFi · الشبكة · CPU/RAM · التهديدات
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Platform,
  RefreshControl,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "../theme/colors";
import { SPACING, RADIUS } from "../theme/spacing";
import { STORAGE_KEYS } from "../../constants/storage-keys";
import { AIDEN_DEFAULT_URL } from "../../config/aiden.config";
import {
  fetchSecuritySnapshot,
  fetchNetworkScan,
  SecuritySnapshot,
  NetworkDevice,
  getSignalLabel,
  getSignalColor,
  getCpuColor,
} from "../../services/security.service";

// ── Animated progress bar ────────────────────────────────────

function ProgressBar({ value, color, max = 100 }: { value: number | null; color: string; max?: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  const pct = value !== null ? Math.min(100, (value / max) * 100) : 0;

  useEffect(() => {
    Animated.timing(anim, { toValue: pct, duration: 600, useNativeDriver: false }).start();
  }, [pct, anim]);

  return (
    <View style={pbStyles.track}>
      <Animated.View
        style={[
          pbStyles.fill,
          {
            width: anim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }),
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

const pbStyles = StyleSheet.create({
  track: { height: 6, backgroundColor: "#1E2A40", borderRadius: 3, overflow: "hidden", flex: 1 },
  fill: { height: "100%", borderRadius: 3 },
});

// ── Metric card ──────────────────────────────────────────────

function MetricCard({
  icon,
  title,
  value,
  sub,
  color,
  progress,
  maxProgress,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  value: string;
  sub?: string;
  color: string;
  progress?: number | null;
  maxProgress?: number;
}) {
  return (
    <View style={mcStyles.card}>
      <LinearGradient colors={["#1A2236", "#141928"]} style={mcStyles.gradient}>
        <View style={mcStyles.header}>
          <View style={[mcStyles.iconWrap, { backgroundColor: color + "22" }]}>
            <Feather name={icon} size={14} color={color} />
          </View>
          <Text style={mcStyles.title}>{title}</Text>
        </View>
        <Text style={[mcStyles.value, { color }]}>{value}</Text>
        {progress !== undefined && (
          <View style={mcStyles.progressRow}>
            <ProgressBar value={progress} color={color} max={maxProgress} />
            <Text style={[mcStyles.pct, { color }]}>{progress !== null ? `${Math.round(progress)}%` : "--"}</Text>
          </View>
        )}
        {sub && <Text style={mcStyles.sub}>{sub}</Text>}
      </LinearGradient>
    </View>
  );
}

const mcStyles = StyleSheet.create({
  card: { flex: 1, borderRadius: RADIUS.md, overflow: "hidden", borderWidth: 1, borderColor: "#1E2A40" },
  gradient: { padding: SPACING.md, gap: SPACING.xs },
  header: { flexDirection: "row", alignItems: "center", gap: 6 },
  iconWrap: { width: 26, height: 26, borderRadius: RADIUS.sm, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 10, color: COLORS.textMuted, fontWeight: "600" as const, textTransform: "uppercase" as const, flex: 1 },
  value: { fontSize: 18, fontWeight: "800" as const, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  pct: { fontSize: 9, fontWeight: "700" as const },
  sub: { fontSize: 10, color: COLORS.textMuted },
});

// ── Device row ───────────────────────────────────────────────

function DeviceRow({ device, index }: { device: NetworkDevice; index: number }) {
  const isNew = device.isNew;
  return (
    <View style={[drStyles.row, isNew && drStyles.rowNew]}>
      <View style={[drStyles.dot, { backgroundColor: isNew ? "#f97316" : "#22c55e" }]} />
      <View style={drStyles.info}>
        <Text style={drStyles.ip}>{device.ip}</Text>
        {device.hostname && <Text style={drStyles.hostname}>{device.hostname}</Text>}
      </View>
      {device.vendor && <Text style={drStyles.vendor}>{device.vendor}</Text>}
      {isNew && (
        <View style={drStyles.newBadge}>
          <Text style={drStyles.newText}>جديد!</Text>
        </View>
      )}
    </View>
  );
}

const drStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: "#1E2A40" },
  rowNew: { backgroundColor: "#f9731611" },
  dot: { width: 8, height: 8, borderRadius: 4 },
  info: { flex: 1 },
  ip: { fontSize: 12, color: COLORS.textPrimary, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontWeight: "600" as const },
  hostname: { fontSize: 10, color: COLORS.textMuted },
  vendor: { fontSize: 10, color: COLORS.textSecondary, maxWidth: 80 },
  newBadge: { backgroundColor: "#f9731633", borderRadius: RADIUS.sm, paddingHorizontal: 6, paddingVertical: 2 },
  newText: { fontSize: 9, color: "#f97316", fontWeight: "800" as const },
});

// ── Main Screen ──────────────────────────────────────────────

export function SecurityDashboard() {
  const insets = useSafeAreaInsets();
  const [serverUrl, setServerUrl] = useState(AIDEN_DEFAULT_URL);
  const [snapshot, setSnapshot] = useState<SecuritySnapshot | null>(null);
  const [devices, setDevices] = useState<NetworkDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [alertActive, setAlertActive] = useState(false);
  const alertPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.AIDEN_SERVER_URL).then((v) => {
      if (v) setServerUrl(v);
    });
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await fetchSecuritySnapshot(serverUrl);
      setSnapshot(snap);
      setLastRefresh(new Date());
      const hasThreats = snap.threats.length > 0;
      setAlertActive(hasThreats);
    } finally {
      setLoading(false);
    }
  }, [serverUrl]);

  const runNetworkScan = useCallback(async () => {
    setScanning(true);
    try {
      const devs = await fetchNetworkScan(serverUrl);
      setDevices(devs);
    } finally {
      setScanning(false);
    }
  }, [serverUrl]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    if (alertActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(alertPulse, { toValue: 0.4, duration: 500, useNativeDriver: true }),
          Animated.timing(alertPulse, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      alertPulse.setValue(1);
    }
  }, [alertActive, alertPulse]);

  const signalColor = getSignalColor(snapshot?.wifiSignal ?? null);
  const cpuColor = getCpuColor(snapshot?.cpuUsage ?? null);
  const ramPct = snapshot?.ramUsage !== null && snapshot?.ramTotal
    ? (snapshot.ramUsage! / snapshot.ramTotal!) * 100
    : null;
  const ramColor = getCpuColor(ramPct);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient colors={["#0F1829", "#0B0F1A"]} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="arrow-right" size={22} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerTitleRow}>
            {alertActive ? (
              <Animated.View style={[styles.alertDot, { opacity: alertPulse }]} />
            ) : (
              <View style={styles.safeDot} />
            )}
            <Text style={styles.headerTitle}>Security Dashboard</Text>
          </View>
          <Text style={styles.headerSub}>
            {lastRefresh ? `آخر تحديث: ${lastRefresh.toLocaleTimeString("ar")}` : "جاري التحميل..."}
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={refresh} disabled={loading} activeOpacity={0.7}>
          {loading
            ? <ActivityIndicator size="small" color={COLORS.accent} />
            : <Feather name="refresh-cw" size={18} color={COLORS.accent} />
          }
        </TouchableOpacity>
      </LinearGradient>

      {/* Alert banner */}
      {alertActive && (
        <View style={styles.alertBanner}>
          <Feather name="alert-triangle" size={14} color="#ef4444" />
          <Text style={styles.alertText}>
            {snapshot?.threats.length} تهديد مكتشف · يُنصح بفحص الشبكة فوراً
          </Text>
          <TouchableOpacity onPress={runNetworkScan}>
            <Text style={styles.alertAction}>فحص</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={COLORS.accent} />}
      >
        {/* Section: Metrics */}
        <Text style={styles.sectionTitle}>مقاييس النظام</Text>
        <View style={styles.metricsRow}>
          <MetricCard
            icon="wifi"
            title="WiFi Signal"
            value={snapshot?.wifiSignal !== null && snapshot?.wifiSignal !== undefined ? `${snapshot.wifiSignal} dBm` : "—"}
            sub={getSignalLabel(snapshot?.wifiSignal ?? null)}
            color={signalColor}
            progress={snapshot?.wifiSignal !== null && snapshot?.wifiSignal !== undefined ? Math.max(0, 100 + (snapshot.wifiSignal ?? -100)) : null}
          />
          <View style={styles.gap} />
          <MetricCard
            icon="cpu"
            title="CPU Usage"
            value={snapshot?.cpuUsage !== null && snapshot?.cpuUsage !== undefined ? `${Math.round(snapshot.cpuUsage)}%` : "—"}
            color={cpuColor}
            progress={snapshot?.cpuUsage ?? null}
          />
        </View>

        <View style={[styles.metricsRow, { marginTop: SPACING.sm }]}>
          <MetricCard
            icon="server"
            title="RAM Usage"
            value={ramPct !== null ? `${Math.round(ramPct)}%` : "—"}
            sub={snapshot?.ramTotal ? `${Math.round((snapshot.ramUsage ?? 0) / 1024)}MB / ${Math.round(snapshot.ramTotal / 1024)}MB` : undefined}
            color={ramColor}
            progress={ramPct}
          />
          <View style={styles.gap} />
          <MetricCard
            icon="shield"
            title="Open Ports"
            value={snapshot?.openPorts.length ? String(snapshot.openPorts.length) : "0"}
            sub={snapshot?.openPorts.slice(0, 4).join(", ") || "لا منافذ مفتوحة"}
            color={snapshot?.openPorts.length ? "#f97316" : "#22c55e"}
          />
        </View>

        {/* Section: Network SSID */}
        {snapshot?.wifiSsid && (
          <View style={styles.ssidCard}>
            <Feather name="wifi" size={14} color={COLORS.accent} />
            <Text style={styles.ssidText}>متصل بـ: <Text style={styles.ssidName}>{snapshot.wifiSsid}</Text></Text>
          </View>
        )}

        {/* Section: Threats */}
        {(snapshot?.threats.length ?? 0) > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: "#ef4444" }]}>⚠ تهديدات مكتشفة</Text>
            {snapshot!.threats.map((t, i) => (
              <View key={i} style={styles.threatRow}>
                <Feather name="alert-circle" size={14} color="#ef4444" />
                <Text style={styles.threatText}>{t}</Text>
              </View>
            ))}
          </>
        )}

        {/* Section: Network Devices */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>أجهزة الشبكة</Text>
          <TouchableOpacity
            style={styles.scanBtn}
            onPress={runNetworkScan}
            disabled={scanning}
            activeOpacity={0.7}
          >
            {scanning
              ? <ActivityIndicator size="small" color={COLORS.accent} />
              : <Feather name="search" size={14} color={COLORS.accent} />
            }
            <Text style={styles.scanBtnText}>{scanning ? "يفحص..." : "فحص الشبكة"}</Text>
          </TouchableOpacity>
        </View>

        {devices.length === 0 && !scanning && (
          <View style={styles.emptyDevices}>
            <Feather name="wifi-off" size={28} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>اضغط "فحص الشبكة" لاكتشاف الأجهزة</Text>
          </View>
        )}

        {devices.length > 0 && (
          <View style={styles.devicesCard}>
            {devices.map((d, i) => (
              <DeviceRow key={d.ip + i} device={d} index={i} />
            ))}
          </View>
        )}

        {/* Section: New device proactive alert */}
        {devices.some((d) => d.isNew) && (
          <View style={styles.proactiveAlert}>
            <Feather name="zap" size={16} color="#f97316" />
            <View style={{ flex: 1 }}>
              <Text style={styles.proactiveTitle}>تنبيه استباقي من Aiden</Text>
              <Text style={styles.proactiveDesc}>
                تم اكتشاف جهاز جديد على شبكتك. يُنصح بتشغيل Nmap scan للتحقق.
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primaryBg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  backBtn: { padding: SPACING.xs },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  alertDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#ef4444" },
  safeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#22c55e" },
  headerTitle: { fontSize: 15, fontWeight: "700" as const, color: COLORS.textPrimary },
  headerSub: { fontSize: 10, color: COLORS.textMuted, marginTop: 1 },
  refreshBtn: { padding: SPACING.xs },
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: "#ef444422",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#ef444444",
  },
  alertText: { flex: 1, fontSize: 12, color: "#ef4444", textAlign: "right" },
  alertAction: { fontSize: 12, color: "#ef4444", fontWeight: "800" as const, textDecorationLine: "underline" as const },
  scroll: { flex: 1 },
  content: { padding: SPACING.md, gap: SPACING.sm },
  sectionTitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: "700" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: SPACING.sm },
  metricsRow: { flexDirection: "row" },
  gap: { width: SPACING.sm },
  ssidCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.accent + "33",
    marginTop: SPACING.sm,
  },
  ssidText: { fontSize: 13, color: COLORS.textSecondary },
  ssidName: { color: COLORS.accent, fontWeight: "700" as const },
  threatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: "#ef444411",
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: "#ef444433",
  },
  threatText: { flex: 1, fontSize: 12, color: "#ef4444" },
  scanBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.accent + "18",
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.accent + "44",
  },
  scanBtnText: { fontSize: 12, color: COLORS.accent, fontWeight: "600" as const },
  emptyDevices: { alignItems: "center", gap: SPACING.sm, padding: SPACING.xxl },
  emptyText: { fontSize: 13, color: COLORS.textMuted, textAlign: "center" },
  devicesCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  proactiveAlert: {
    flexDirection: "row",
    gap: SPACING.md,
    backgroundColor: "#f9731618",
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: "#f9731644",
    marginTop: SPACING.sm,
  },
  proactiveTitle: { fontSize: 13, color: "#f97316", fontWeight: "700" as const, textAlign: "right" },
  proactiveDesc: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2, textAlign: "right" },
});
