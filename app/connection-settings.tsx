// ============================================================
// Connection Settings — إعدادات الاتصال بـ Aiden
// تغيير IP · Ngrok URL · اختبار الاتصال
// ============================================================

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Animated,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Stack, router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { COLORS } from "@/src/ui/theme/colors";
import { SPACING, RADIUS } from "@/src/ui/theme/spacing";
import { STORAGE_KEYS } from "@/src/constants/storage-keys";
import { AIDEN_DEFAULT_URL } from "@/src/config/aiden.config";
import { useWebSocket } from "@/src/providers/WebSocketProvider";
import { testAidenTTS } from "@/src/services/hassan-tts.service";

// ── Preset servers ────────────────────────────────────────────

const PRESETS = [
  {
    label: "نفس الجهاز (Termux)",
    sublabel: "localhost · 127.0.0.1",
    url: "http://127.0.0.1:4200",
    icon: "smartphone" as const,
    color: COLORS.neonGreen,
  },
  {
    label: "شبكة Wi-Fi المحلية",
    sublabel: "192.168.x.x",
    url: "http://192.168.1.100:4200",
    icon: "wifi" as const,
    color: COLORS.neonBlue,
  },
  {
    label: "Ngrok Tunnel",
    sublabel: "https://xxxx.ngrok.io",
    url: "https://",
    icon: "globe" as const,
    color: COLORS.neonPurple,
  },
  {
    label: "USB Tethering",
    sublabel: "10.0.2.2 (Android Emulator)",
    url: "http://10.0.2.2:4200",
    icon: "link" as const,
    color: COLORS.neonOrange,
  },
];

// ── Test result type ──────────────────────────────────────────

type TestState =
  | { status: "idle" }
  | { status: "testing" }
  | { status: "ok"; latencyMs: number; ttsOk: boolean }
  | { status: "error"; message: string };

export default function ConnectionSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { serverUrl, updateServerUrl, wsStatus } = useWebSocket();

  const [inputUrl, setInputUrl] = useState(serverUrl);
  const [testState, setTestState] = useState<TestState>({ status: "idle" });
  const [saved, setSaved] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Sync with current serverUrl
  useEffect(() => {
    setInputUrl(serverUrl);
  }, [serverUrl]);

  // Pulse animation for status dot
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.4, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  // ── Test connection ─────────────────────────────────────────

  const handleTest = async () => {
    const url = inputUrl.trim().replace(/\/$/, "");
    if (!url.startsWith("http")) {
      Alert.alert("عنوان غير صالح", "يجب أن يبدأ العنوان بـ http:// أو https://");
      return;
    }

    setTestState({ status: "testing" });

    try {
      // Health check — Aiden uses /api/health
      const start = Date.now();
      const hRes = await fetch(`${url}/api/health`, {
        signal: AbortSignal.timeout(6000),
      }).catch(() => null);

      const latencyMs = Date.now() - start;

      if (!hRes?.ok) {
        setTestState({
          status: "error",
          message: `تعذّر الوصول إلى الخادم\n(${url})`,
        });
        return;
      }

      // TTS test
      const ttsResult = await testAidenTTS(url);

      setTestState({
        status: "ok",
        latencyMs,
        ttsOk: ttsResult.ok,
      });
    } catch (e: unknown) {
      setTestState({
        status: "error",
        message: e instanceof Error ? e.message : "فشل الاتصال",
      });
    }
  };

  // ── Save ────────────────────────────────────────────────────

  const handleSave = async () => {
    const url = inputUrl.trim().replace(/\/$/, "");
    if (!url.startsWith("http")) {
      Alert.alert("عنوان غير صالح", "يجب أن يبدأ العنوان بـ http:// أو https://");
      return;
    }

    await updateServerUrl(url);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // ── Reset to default ─────────────────────────────────────────

  const handleReset = () => {
    setInputUrl(AIDEN_DEFAULT_URL);
    setTestState({ status: "idle" });
  };

  // ── Status dot color ─────────────────────────────────────────

  const statusColor =
    wsStatus === "connected"
      ? COLORS.neonGreen
      : wsStatus === "connecting"
      ? COLORS.neonOrange
      : COLORS.neonRed;

  const statusLabel =
    wsStatus === "connected"
      ? "متصل"
      : wsStatus === "connecting"
      ? "جاري الاتصال..."
      : "غير متصل";

  return (
    <>
      <Stack.Screen
        options={{
          title: "إعدادات الاتصال",
          headerStyle: { backgroundColor: COLORS.primaryBg },
          headerTintColor: COLORS.textPrimary,
          headerShadowVisible: false,
          headerBackTitle: "رجوع",
        }}
      />

      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Current Status Card ── */}
          <LinearGradient
            colors={[statusColor + "18", statusColor + "06", "transparent"]}
            style={[styles.statusCard, { borderColor: statusColor + "33" }]}
          >
            <View style={styles.statusRow}>
              <Animated.View
                style={[
                  styles.statusDot,
                  { backgroundColor: statusColor, transform: [{ scale: pulseAnim }] },
                ]}
              />
              <View style={styles.statusInfo}>
                <Text style={styles.statusLabel}>Aiden WebSocket</Text>
                <Text style={[styles.statusValue, { color: statusColor }]}>
                  {statusLabel}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.reconnectBtn, { borderColor: statusColor + "55" }]}
                onPress={() => updateServerUrl(inputUrl)}
              >
                <Feather name="refresh-cw" size={14} color={statusColor} />
                <Text style={[styles.reconnectText, { color: statusColor }]}>اتصال</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.urlRow}>
              <Feather name="server" size={13} color={COLORS.textMuted} />
              <Text style={styles.currentUrlText} numberOfLines={1}>
                {serverUrl}
              </Text>
            </View>
          </LinearGradient>

          {/* ── URL Input ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>عنوان الخادم</Text>
            <Text style={styles.sectionSub}>
              أدخل IP أو Ngrok URL لخادم Aiden الذي يعمل على جهازك
            </Text>

            <View style={styles.inputWrapper}>
              <Feather name="link" size={16} color={COLORS.neonCyan} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={inputUrl}
                onChangeText={(v) => {
                  setInputUrl(v);
                  setTestState({ status: "idle" });
                  setSaved(false);
                }}
                placeholder="http://192.168.1.x:4200"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                returnKeyType="done"
                selectionColor={COLORS.neonCyan}
              />
              {inputUrl.length > 0 && (
                <TouchableOpacity onPress={() => { setInputUrl(""); setTestState({ status: "idle" }); }}>
                  <Feather name="x" size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Test Result */}
            {testState.status === "ok" && (
              <View style={styles.testResult}>
                <Feather name="check-circle" size={14} color={COLORS.neonGreen} />
                <Text style={[styles.testResultText, { color: COLORS.neonGreen }]}>
                  اتصال ناجح · {testState.latencyMs}ms
                  {testState.ttsOk ? " · TTS ✓" : " · TTS غير متاح"}
                </Text>
              </View>
            )}
            {testState.status === "error" && (
              <View style={styles.testResult}>
                <Feather name="alert-circle" size={14} color={COLORS.neonRed} />
                <Text style={[styles.testResultText, { color: COLORS.neonRed }]}>
                  {testState.message}
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.testBtn, testState.status === "testing" && styles.btnDisabled]}
                onPress={handleTest}
                disabled={testState.status === "testing"}
              >
                {testState.status === "testing" ? (
                  <ActivityIndicator size="small" color={COLORS.neonCyan} />
                ) : (
                  <Feather name="zap" size={15} color={COLORS.neonCyan} />
                )}
                <Text style={styles.testBtnText}>
                  {testState.status === "testing" ? "جاري الاختبار..." : "اختبار الاتصال"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  saved && styles.saveBtnSuccess,
                  (saved) && { borderColor: COLORS.neonGreen + "66" },
                ]}
                onPress={handleSave}
              >
                <Feather
                  name={saved ? "check" : "save"}
                  size={15}
                  color={saved ? COLORS.neonGreen : COLORS.accent}
                />
                <Text style={[styles.saveBtnText, saved && { color: COLORS.neonGreen }]}>
                  {saved ? "تم الحفظ!" : "حفظ وتطبيق"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Quick Presets ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>إعدادات سريعة</Text>
            <Text style={styles.sectionSub}>
              اختر السيناريو المناسب لاتصالك بـ Aiden
            </Text>

            <View style={styles.presetGrid}>
              {PRESETS.map((p) => (
                <TouchableOpacity
                  key={p.url}
                  style={[
                    styles.presetCard,
                    {
                      borderColor: p.color + "33",
                      backgroundColor: p.color + "0C",
                    },
                    inputUrl === p.url && {
                      borderColor: p.color + "88",
                      backgroundColor: p.color + "1A",
                    },
                  ]}
                  onPress={() => {
                    setInputUrl(p.url);
                    setTestState({ status: "idle" });
                  }}
                >
                  <View
                    style={[styles.presetIcon, { backgroundColor: p.color + "20" }]}
                  >
                    <Feather name={p.icon} size={18} color={p.color} />
                  </View>
                  <Text style={styles.presetLabel}>{p.label}</Text>
                  <Text style={styles.presetSub}>{p.sublabel}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Voice Engine Status ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>محرك صوت الحسن</Text>

            <View style={styles.voiceCard}>
              <VoiceLayer
                icon="server"
                label="Aiden Server TTS"
                sublabel={`${serverUrl}/api/tts`}
                priority="0"
                active={wsStatus === "connected"}
                color={COLORS.neonGreen}
              />
              <View style={styles.voiceDivider} />
              <VoiceLayer
                icon="cloud"
                label="Gemini 2.5 Flash TTS"
                sublabel="صوت Orus العربي · مباشر"
                priority="1"
                active={true}
                color={COLORS.neonBlue}
              />
              <View style={styles.voiceDivider} />
              <VoiceLayer
                icon="cloud"
                label="Gemini via API Server"
                sublabel="احتياط عبر الخادم"
                priority="2"
                active={true}
                color={COLORS.neonPurple}
              />
              <View style={styles.voiceDivider} />
              <VoiceLayer
                icon="alert-triangle"
                label="System TTS (expo-speech)"
                sublabel="معطَّل — لا يُستخدم"
                priority="3"
                active={false}
                color={COLORS.textMuted}
                disabled
              />
            </View>
          </View>

          {/* ── Instructions ── */}
          <View style={styles.instructionCard}>
            <Feather name="info" size={15} color={COLORS.neonCyan} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.instructionTitle}>كيفية تشغيل Aiden على Termux</Text>
              <Text style={styles.instructionText}>
                1. افتح Termux على هاتفك{"\n"}
                2. شغّل: {"`python3 aiden.py --port 4200`"}{"\n"}
                3. إن كان التطبيق على نفس الجهاز: استخدم 127.0.0.1{"\n"}
                4. إن كان على جهاز آخر بنفس الشبكة: استخدم IP الخاص{"\n"}
                5. للوصول من خارج الشبكة: استخدم Ngrok
              </Text>
            </View>
          </View>

          {/* Reset */}
          <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <Feather name="rotate-ccw" size={14} color={COLORS.textMuted} />
            <Text style={styles.resetText}>إعادة للإعداد الافتراضي</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

// ── Voice Layer Component ─────────────────────────────────────

function VoiceLayer({
  icon,
  label,
  sublabel,
  priority,
  active,
  color,
  disabled = false,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  sublabel: string;
  priority: string;
  active: boolean;
  color: string;
  disabled?: boolean;
}) {
  return (
    <View style={[styles.voiceLayer, disabled && { opacity: 0.45 }]}>
      <View style={[styles.priorityBadge, { backgroundColor: color + "20", borderColor: color + "44" }]}>
        <Text style={[styles.priorityText, { color }]}>{priority}</Text>
      </View>
      <View style={[styles.voiceLayerIcon, { backgroundColor: color + "18" }]}>
        <Feather name={icon} size={14} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.voiceLayerLabel}>{label}</Text>
        <Text style={styles.voiceLayerSub}>{sublabel}</Text>
      </View>
      <View
        style={[
          styles.activeIndicator,
          { backgroundColor: active ? COLORS.neonGreen : COLORS.textMuted + "44" },
        ]}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.primaryBg },
  scroll: { flex: 1 },
  content: { padding: SPACING.lg, gap: SPACING.lg },

  // Status card
  statusCard: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  statusRow: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusInfo: { flex: 1 },
  statusLabel: { fontSize: 11, color: COLORS.textMuted },
  statusValue: { fontSize: 14, fontWeight: "700" as const },
  reconnectBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  reconnectText: { fontSize: 12, fontWeight: "600" as const },
  urlRow: { flexDirection: "row", alignItems: "center", gap: SPACING.xs },
  currentUrlText: { fontSize: 11, color: COLORS.textMuted, flex: 1, fontFamily: Platform.OS === "ios" ? "Courier" : "monospace" },

  // Section
  section: {
    backgroundColor: COLORS.glassCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  sectionTitle: { fontSize: 15, color: COLORS.textPrimary, fontWeight: "700" as const },
  sectionSub: { fontSize: 12, color: COLORS.textMuted, lineHeight: 18, marginTop: -4 },

  // Input
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.neonCyan + "33",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  inputIcon: {},
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 13,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    padding: 0,
  },

  // Test result
  testResult: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.xs,
    paddingHorizontal: SPACING.xs,
  },
  testResultText: { fontSize: 12, flex: 1, lineHeight: 18 },

  // Action row
  actionRow: { flexDirection: "row", gap: SPACING.sm },
  testBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.neonCyan + "44",
    backgroundColor: COLORS.neonCyan + "10",
  },
  testBtnText: { fontSize: 13, color: COLORS.neonCyan, fontWeight: "600" as const },
  saveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.accent + "44",
    backgroundColor: COLORS.accent + "10",
  },
  saveBtnText: { fontSize: 13, color: COLORS.accent, fontWeight: "600" as const },
  saveBtnSuccess: { backgroundColor: COLORS.neonGreen + "10" },
  btnDisabled: { opacity: 0.6 },

  // Presets
  presetGrid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm },
  presetCard: {
    width: "47.5%",
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  presetIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  presetLabel: { fontSize: 12, color: COLORS.textPrimary, fontWeight: "600" as const },
  presetSub: { fontSize: 10, color: COLORS.textMuted },

  // Voice card
  voiceCard: {
    backgroundColor: COLORS.surfaceBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    overflow: "hidden",
  },
  voiceLayer: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  voiceDivider: { height: 1, backgroundColor: COLORS.glassBorder, marginHorizontal: SPACING.md },
  priorityBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  priorityText: { fontSize: 11, fontWeight: "800" as const },
  voiceLayerIcon: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  voiceLayerLabel: { fontSize: 12, color: COLORS.textPrimary, fontWeight: "600" as const },
  voiceLayerSub: { fontSize: 10, color: COLORS.textMuted },
  activeIndicator: { width: 7, height: 7, borderRadius: 4 },

  // Instructions
  instructionCard: {
    flexDirection: "row",
    gap: SPACING.md,
    backgroundColor: COLORS.neonCyan + "0C",
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.neonCyan + "22",
    padding: SPACING.lg,
  },
  instructionTitle: { fontSize: 13, color: COLORS.neonCyan, fontWeight: "700" as const, marginBottom: 6 },
  instructionText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 20 },

  // Reset
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
  },
  resetText: { fontSize: 12, color: COLORS.textMuted },
});
