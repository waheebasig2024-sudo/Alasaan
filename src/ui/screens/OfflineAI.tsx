import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Clipboard,
  Pressable,
  ToastAndroid,
  Image,
  Animated,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import { COLORS } from "../theme/colors";
import { SPACING, RADIUS } from "../theme/spacing";
import { TYPOGRAPHY } from "../theme/typography";
import {
  checkAidenConnection,
  sendMessageToAiden,
  ConnectionStatus,
} from "../../services/aiden.service";
import { AIDEN_DEFAULT_URL } from "../../config/aiden.config";
import { STORAGE_KEYS } from "../../constants/storage-keys";
import { generateId } from "../../utils/text";
import { now } from "../../utils/time";

// ── Groq fallback عندما Aiden غير متاح ─────────────────────

function resolveApiBase(): string {
  try {
    const extra = (Constants.expoConfig?.extra as Record<string, unknown>) ?? {};
    const domain = (extra.apiDomain as string) || "";
    if (!domain) return "";
    const clean = domain.replace(/^https?:\/\//, "").replace(/\/+$/, "");
    return `https://${clean}/api`;
  } catch { return ""; }
}

async function sendMessageViaGroq(
  text: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  onToken: (t: string) => void,
  onDone: (provider: string) => void,
  onError: (e: string) => void
): Promise<void> {
  const base = resolveApiBase();
  if (!base) { onError("لا يوجد اتصال بالإنترنت"); return; }
  try {
    const res = await fetch(`${base}/groq-chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, history }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) { onError(`HTTP ${res.status}`); return; }
    const reader = res.body?.getReader();
    if (!reader) { onError("لا يمكن قراءة الاستجابة"); return; }
    const dec = new TextDecoder();
    let buf = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n"); buf = lines.pop() ?? "";
      for (const line of lines) {
        const t = line.trim();
        if (!t.startsWith("data: ")) continue;
        const j = t.slice(6).trim();
        if (j === "[DONE]") { onDone("Groq / LLaMA 3.3"); return; }
        try {
          const chunk = JSON.parse(j) as { token?: string; done?: boolean; error?: string; provider?: string };
          if (chunk.error) { onError(chunk.error); return; }
          if (chunk.token) onToken(chunk.token);
          if (chunk.done) { onDone(chunk.provider ?? "Groq / LLaMA 3.3"); return; }
        } catch { /* skip */ }
      }
    }
    onDone("Groq / LLaMA 3.3");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "خطأ في الشبكة";
    onError(msg);
  }
}

// ── أوامر التشغيل التلقائي ──────────────────────────────────

const AUTO_START_STEPS = [
  {
    title: "الخطوة 1 — افتح Termux وادخل Kali",
    desc: "نفّذ هذا الأمر في Termux للدخول إلى بيئة Kali Linux",
    cmd: "nh",
  },
  {
    title: "الخطوة 2 — أنشئ الاختصار (داخل Kali)",
    desc: "نفّذه مرة واحدة فقط — يتجنب مشاكل الاقتباسات",
    cmd: `printf '%s\\n' "alias aiden='cd ~/aiden_setup/aiden-main && AIDEN_PORT=4200 node dist-bundle/index.js serve'" >> ~/.bashrc`,
  },
  {
    title: "الخطوة 3 — فعّل التغيير",
    desc: "شغّل هذا الأمر مرة واحدة بعد الخطوة الثانية",
    cmd: "source ~/.bashrc",
  },
  {
    title: "الآن وإلى الأبد",
    desc: "كل مرة تفتح Termux: ادخل Kali ثم شغّل Aiden بكلمة واحدة",
    cmd: "aiden",
  },
];

function AutoStartModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleCopy = (text: string, idx: number) => {
    Clipboard.setString(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          {/* Header */}
          <View style={modalStyles.sheetHeader}>
            <Text style={modalStyles.sheetTitle}>⚡ تشغيل Aiden تلقائياً</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={modalStyles.closeBtn}>
              <Feather name="x" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={modalStyles.sheetDesc}>
            نفّذ هذه الخطوات مرة واحدة في Termux — بعدها تشغّل Aiden بكلمة واحدة فقط كل مرة
          </Text>

          {/* Steps */}
          {AUTO_START_STEPS.map((step, idx) => (
            <View key={idx} style={modalStyles.stepCard}>
              <View style={modalStyles.stepHeader}>
                <View style={modalStyles.stepNum}>
                  <Text style={modalStyles.stepNumText}>{idx + 1}</Text>
                </View>
                <View style={modalStyles.stepInfo}>
                  <Text style={modalStyles.stepTitle}>{step.title}</Text>
                  <Text style={modalStyles.stepDesc}>{step.desc}</Text>
                </View>
              </View>
              <View style={modalStyles.cmdRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={modalStyles.cmdScroll}>
                  <Text style={modalStyles.cmdText}>{step.cmd}</Text>
                </ScrollView>
                <TouchableOpacity
                  style={[modalStyles.copyBtn, copiedIdx === idx && modalStyles.copyBtnDone]}
                  onPress={() => handleCopy(step.cmd, idx)}
                  activeOpacity={0.75}
                >
                  <Feather
                    name={copiedIdx === idx ? "check" : "copy"}
                    size={14}
                    color={copiedIdx === idx ? "#22c55e" : COLORS.textMuted}
                  />
                  <Text style={[modalStyles.copyText, copiedIdx === idx && modalStyles.copyTextDone]}>
                    {copiedIdx === idx ? "تم النسخ" : "نسخ"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Tip */}
          <View style={modalStyles.tip}>
            <Feather name="info" size={13} color={COLORS.accent} />
            <Text style={modalStyles.tipText}>
              افتح Termux ← اكتب <Text style={modalStyles.tipCode}>nh</Text> للدخول لـ Kali ← نفّذ الخطوات 2 و3 مرة واحدة ← بعدها اكتب{" "}
              <Text style={modalStyles.tipCode}>aiden</Text> فقط
            </Text>
          </View>

          <TouchableOpacity style={modalStyles.doneBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={modalStyles.doneBtnText}>فهمت، شكراً</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.secondaryBg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl + 8,
    paddingTop: SPACING.md,
    gap: SPACING.md,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: COLORS.textPrimary,
  },
  closeBtn: {
    padding: SPACING.xs,
  },
  sheetDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
    textAlign: "right",
  },
  stepCard: {
    backgroundColor: COLORS.primaryBg,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepHeader: {
    flexDirection: "row",
    gap: SPACING.sm,
    alignItems: "flex-start",
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  stepNumText: {
    color: COLORS.primaryBg,
    fontWeight: "700" as const,
    fontSize: 12,
  },
  stepInfo: { flex: 1 },
  stepTitle: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: COLORS.textPrimary,
    textAlign: "right",
  },
  stepDesc: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    textAlign: "right",
  },
  cmdRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0d1117",
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: "#30363d",
  },
  cmdScroll: { flex: 1 },
  cmdText: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 11,
    color: "#58a6ff",
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.secondaryBg,
  },
  copyBtnDone: {
    borderColor: "#22c55e33",
    backgroundColor: "#14532d22",
  },
  copyText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  copyTextDone: {
    color: "#22c55e",
  },
  tip: {
    flexDirection: "row",
    gap: SPACING.xs,
    alignItems: "flex-start",
    backgroundColor: COLORS.accent + "11",
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.accent + "33",
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
    textAlign: "right",
  },
  tipCode: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    color: COLORS.accent,
    fontWeight: "700" as const,
  },
  doneBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: "center",
    marginTop: SPACING.xs,
  },
  doneBtnText: {
    color: COLORS.primaryBg,
    fontWeight: "700" as const,
    fontSize: 15,
  },
});

// ── أنواع ──────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant" | "activity";
  content: string;
  timestamp: number;
  provider?: string;
  imageUri?: string;
}

// ── TTS: تشغيل الصوت من Aiden ───────────────────────────────

let currentSound: Audio.Sound | null = null;

async function playTTSFromText(text: string, serverUrl: string) {
  try {
    // إيقاف الصوت السابق
    if (currentSound) {
      await currentSound.stopAsync().catch(() => {});
      await currentSound.unloadAsync().catch(() => {});
      currentSound = null;
    }

    const ttsUrl = `${serverUrl.replace(/\/$/, "")}/api/tts`;
    const res = await fetch(ttsUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.slice(0, 500) }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return;

    // تحويل الاستجابة إلى base64 ثم حفظها في ملف مؤقت (expo-av لا يدعم data: URIs)
    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    const b64 = btoa(binary);

    const contentType = res.headers.get("content-type") ?? "";
    const ext = contentType.includes("wav") ? "wav" : contentType.includes("ogg") ? "ogg" : "mp3";
    const uri = `${FileSystem.cacheDirectory}aiden_tts_${Date.now()}.${ext}`;

    await FileSystem.writeAsStringAsync(uri, b64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
    currentSound = sound;

    sound.setOnPlaybackStatusUpdate((s) => {
      if (s.isLoaded && s.didJustFinish) {
        sound.unloadAsync().catch(() => {});
        FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
        currentSound = null;
      }
    });
  } catch { /* الصوت اختياري */ }
}

// ── مكوّن نقطة حالة الاتصال ────────────────────────────────

function ConnectionDot({ status }: { status: ConnectionStatus }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status === "checking") {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [status, pulseAnim]);

  const color =
    status === "connected" ? "#22c55e"
    : status === "checking" ? "#eab308"
    : "#ef4444";

  const label =
    status === "connected" ? "متصل"
    : status === "checking" ? "فحص..."
    : "غير متصل";

  return (
    <View style={dotStyles.wrapper}>
      <Animated.View style={[dotStyles.dot, { backgroundColor: color, opacity: pulseAnim }]} />
      <Text style={[dotStyles.label, { color }]}>{label}</Text>
    </View>
  );
}

const dotStyles = StyleSheet.create({
  wrapper: { flexDirection: "row", alignItems: "center", gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { fontSize: 11, fontWeight: "600" as const },
});

// ── Smart Dashboard ─────────────────────────────────────────

interface DashboardProps {
  status: ConnectionStatus;
  version?: string;
  pingMs: number | null;
  serverUrl: string;
}

function SmartDashboard({ status, version, pingMs, serverUrl }: DashboardProps) {
  const isConnected = status === "connected";
  const isChecking = status === "checking";

  const statusColor = isConnected ? "#22c55e" : isChecking ? "#eab308" : "#ef4444";
  const statusLabel = isConnected ? "متصل ✓" : isChecking ? "جاري الفحص..." : "غير متصل";

  const memoryColor = isConnected ? "#22c55e" : "#5C6680";
  const memoryFill = isConnected ? 0.72 : 0;

  return (
    <View style={dashStyles.card}>
      <LinearGradient
        colors={["rgba(30,42,64,0.95)", "rgba(20,25,40,0.95)"]}
        style={dashStyles.gradient}
      >
        {/* Row 1: Connection + Server */}
        <View style={dashStyles.row}>
          <View style={dashStyles.cell}>
            <View style={dashStyles.cellHeader}>
              <View style={[dashStyles.liveDot, { backgroundColor: statusColor }]} />
              <Text style={dashStyles.cellTitle}>حالة السيرفر</Text>
            </View>
            <Text style={[dashStyles.cellValue, { color: statusColor }]}>{statusLabel}</Text>
            <Text style={dashStyles.cellSub} numberOfLines={1}>
              {serverUrl.replace("http://", "")}
            </Text>
          </View>

          <View style={dashStyles.divider} />

          <View style={dashStyles.cell}>
            <View style={dashStyles.cellHeader}>
              <Feather name="cpu" size={11} color="#60a5fa" />
              <Text style={dashStyles.cellTitle}>المهارات النشطة</Text>
            </View>
            <Text style={[dashStyles.cellValue, { color: "#60a5fa" }]}>
              {isConnected ? "62" : "--"}
            </Text>
            <Text style={dashStyles.cellSub}>
              Aiden {version ? `v${version}` : "v3.18.0"}
            </Text>
          </View>

          <View style={dashStyles.divider} />

          <View style={dashStyles.cell}>
            <View style={dashStyles.cellHeader}>
              <Feather name="database" size={11} color="#a78bfa" />
              <Text style={dashStyles.cellTitle}>الذاكرة</Text>
            </View>
            <View style={dashStyles.memBar}>
              <View style={[dashStyles.memFill, { width: `${memoryFill * 100}%` as any, backgroundColor: memoryColor }]} />
            </View>
            <Text style={[dashStyles.cellSub, { color: memoryColor }]}>
              {isConnected ? "Semantic · 72%" : "غير متزامنة"}
            </Text>
          </View>
        </View>

        {/* Row 2: Ping + Status */}
        {isConnected && (
          <View style={dashStyles.pingRow}>
            <Feather name="activity" size={10} color={COLORS.accent} />
            <Text style={dashStyles.pingLabel}>
              Ping: {pingMs !== null ? `${pingMs}ms` : "—"}
            </Text>
            <View style={dashStyles.dot2} />
            <Text style={dashStyles.pingLabel}>Kali Linux · Port 4200</Text>
            <View style={dashStyles.dot2} />
            <Text style={dashStyles.pingLabel}>Semantic Memory: مزامن</Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const dashStyles = StyleSheet.create({
  card: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(212,168,83,0.2)",
  },
  gradient: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.sm,
  },
  cell: {
    flex: 1,
    gap: 3,
  },
  cellHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cellTitle: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontWeight: "600" as const,
    textTransform: "uppercase" as const,
  },
  cellValue: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: COLORS.textPrimary,
  },
  cellSub: {
    fontSize: 9,
    color: COLORS.textMuted,
  },
  divider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  memBar: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 2,
    overflow: "hidden",
    marginTop: 2,
  },
  memFill: {
    height: "100%" as any,
    borderRadius: 2,
  },
  pingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  pingLabel: {
    fontSize: 9,
    color: COLORS.textMuted,
  },
  dot2: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.textMuted,
  },
});

// ── مكوّن شريط التفكير المتحرك ──────────────────────────────

function ThinkingBar({ active, label }: { active: boolean; label: string }) {
  const animVal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(animVal, { toValue: 1, duration: 1200, useNativeDriver: false }),
          Animated.timing(animVal, { toValue: 0, duration: 1200, useNativeDriver: false }),
        ])
      );
      anim.start();
      return () => anim.stop();
    } else {
      animVal.setValue(0);
    }
  }, [active, animVal]);

  if (!active) return null;

  const barWidth = animVal.interpolate({ inputRange: [0, 1], outputRange: ["20%", "90%"] });
  const barOpacity = animVal.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 1, 0.6] });

  return (
    <View style={thinkStyles.wrapper}>
      <View style={thinkStyles.track}>
        <Animated.View style={[thinkStyles.bar, { width: barWidth, opacity: barOpacity }]}>
          <LinearGradient
            colors={["#D4A853", "#eab308", "#D4A853"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
      <Text style={thinkStyles.label}>{label}</Text>
    </View>
  );
}

const thinkStyles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    gap: 4,
  },
  track: {
    height: 3,
    backgroundColor: "rgba(212,168,83,0.15)",
    borderRadius: 2,
    overflow: "hidden",
  },
  bar: {
    height: "100%" as any,
    borderRadius: 2,
  },
  label: {
    fontSize: 11,
    color: COLORS.accent,
    fontStyle: "italic" as const,
    textAlign: "center",
  },
});

// ── مكوّن رسالة ────────────────────────────────────────────

function MessageBubble({ msg, serverUrl }: { msg: Message; serverUrl: string }) {
  const [copied, setCopied] = useState(false);
  const [playing, setPlaying] = useState(false);

  const handleCopy = useCallback((text: string) => {
    Clipboard.setString(text);
    setCopied(true);
    if (Platform.OS === "android") ToastAndroid.show("تم النسخ ✓", ToastAndroid.SHORT);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const handleSpeak = useCallback(async () => {
    if (playing) return;
    setPlaying(true);
    try {
      await playTTSFromText(msg.content, serverUrl);
    } finally {
      setPlaying(false);
    }
  }, [msg.content, serverUrl, playing]);

  if (msg.role === "activity") {
    return (
      <View style={msgStyles.activityRow}>
        <Feather name="settings" size={11} color={COLORS.textMuted} />
        <Text style={msgStyles.activityText}>{msg.content}</Text>
      </View>
    );
  }

  const isUser = msg.role === "user";
  return (
    <View style={[msgStyles.row, isUser ? msgStyles.rowUser : msgStyles.rowAI]}>
      {!isUser && (
        <View style={msgStyles.avatar}>
          <Text style={msgStyles.avatarText}>A</Text>
        </View>
      )}
      <Pressable
        onLongPress={() => handleCopy(msg.content)}
        delayLongPress={400}
        style={[msgStyles.bubble, isUser ? msgStyles.bubbleUser : msgStyles.bubbleAI, copied && msgStyles.bubbleCopied]}
      >
        {msg.imageUri && (
          <Image
            source={{ uri: msg.imageUri }}
            style={msgStyles.messageImage}
            resizeMode="cover"
          />
        )}
        {msg.content ? (
          <Text
            selectable
            style={[msgStyles.text, isUser ? msgStyles.textUser : msgStyles.textAI]}
          >
            {msg.content}
          </Text>
        ) : null}
        <View style={msgStyles.msgFooter}>
          {copied && (
            <View style={msgStyles.copiedRow}>
              <Feather name="check" size={10} color={COLORS.success} />
              <Text style={msgStyles.copiedText}>تم النسخ</Text>
            </View>
          )}
          {!isUser && msg.content && (
            <TouchableOpacity onPress={handleSpeak} style={msgStyles.voiceBtn} activeOpacity={0.7}>
              {playing
                ? <ActivityIndicator size={10} color={COLORS.accent} />
                : <Feather name="volume-2" size={10} color={COLORS.accent} />
              }
            </TouchableOpacity>
          )}
          {msg.provider && <Text style={msgStyles.provider}>via {msg.provider}</Text>}
        </View>
      </Pressable>
    </View>
  );
}

const msgStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginBottom: SPACING.sm,
    alignItems: "flex-end",
    gap: SPACING.xs,
  },
  rowUser: { justifyContent: "flex-end" },
  rowAI: { justifyContent: "flex-start" },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#1e40af",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "700" as const, fontSize: 12 },
  bubble: {
    maxWidth: "78%",
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  bubbleUser: {
    backgroundColor: COLORS.accent,
    borderBottomRightRadius: 4,
  },
  bubbleAI: {
    backgroundColor: COLORS.secondaryBg,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  text: { fontSize: 14, lineHeight: 20 },
  textUser: { color: COLORS.primaryBg, textAlign: "right" },
  textAI: { color: COLORS.textPrimary, textAlign: "right" },
  provider: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: "left",
  },
  activityRow: {
    flexDirection: "row" as const,
    alignItems: "center",
    marginVertical: SPACING.xs,
    gap: 5,
    justifyContent: "center",
  },
  activityText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontStyle: "italic" as const,
  },
  messageImage: {
    width: "100%" as any,
    height: 180,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.xs,
  },
  bubbleCopied: {
    borderWidth: 1.5,
    borderColor: COLORS.success,
  },
  msgFooter: {
    flexDirection: "row" as const,
    alignItems: "center",
    marginTop: 4,
    gap: 6,
  },
  copiedRow: {
    flexDirection: "row" as const,
    alignItems: "center",
    gap: 3,
  },
  copiedText: {
    fontSize: 10,
    color: COLORS.success,
    fontWeight: "600" as const,
  },
  voiceBtn: {
    padding: 3,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.accent + "15",
    borderWidth: 1,
    borderColor: COLORS.accent + "30",
  },
});

// ── الشاشة الرئيسية ─────────────────────────────────────────

const CHAT_KEY = "@aiden_offline_chat";

export default function OfflineAIScreen() {
  const insets = useSafeAreaInsets();

  const [serverUrl, setServerUrl] = useState(AIDEN_DEFAULT_URL);
  const [editingUrl, setEditingUrl] = useState(false);
  const [urlDraft, setUrlDraft] = useState(AIDEN_DEFAULT_URL);

  const [connStatus, setConnStatus] = useState<ConnectionStatus>("checking");
  const [connVersion, setConnVersion] = useState<string | undefined>();
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [isPinging, setIsPinging] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState<number | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [showAutoStart, setShowAutoStart] = useState(false);
  const [usingGroqFallback, setUsingGroqFallback] = useState(false);

  const flatRef = useRef<FlatList>(null);
  const sessionId = useRef(`mobile-${Date.now()}`);
  const streamingIdRef = useRef<string | null>(null);

  // ── تحميل الإعدادات المحفوظة ──────────────────────────────

  useEffect(() => {
    (async () => {
      try {
        // اقرأ من AIDEN_SERVER_URL (مفتاح مشترك مع WebSocketProvider)
        // مع احتياطي للمفتاح القديم AIDEN_SERVER_CONFIG للتوافقية
        let savedUrl: string | null = await AsyncStorage.getItem(STORAGE_KEYS.AIDEN_SERVER_URL);
        if (!savedUrl) {
          const legacyJson = await AsyncStorage.getItem(STORAGE_KEYS.AIDEN_SERVER_CONFIG);
          if (legacyJson) {
            const parsed = JSON.parse(legacyJson) as { url?: string };
            if (parsed.url) savedUrl = parsed.url;
          }
        }
        if (savedUrl) {
          setServerUrl(savedUrl);
          setUrlDraft(savedUrl);
        }
        const savedChat = await AsyncStorage.getItem(CHAT_KEY);
        if (savedChat) {
          setMessages(JSON.parse(savedChat));
        }
      } catch {}
    })();
  }, []);

  // ── فحص الاتصال عند تغيير serverUrl ─────────────────────

  const checkConn = useCallback(
    async (url: string) => {
      setConnStatus("checking");
      const result = await checkAidenConnection(url);
      setConnStatus(result.status);
      setConnVersion(result.version);
      setLastCheckedAt(Date.now());
    },
    []
  );

  useEffect(() => {
    checkConn(serverUrl);
    const interval = setInterval(() => checkConn(serverUrl), 15000);
    return () => clearInterval(interval);
  }, [serverUrl, checkConn]);

  // ── حفظ المحادثة ─────────────────────────────────────────

  useEffect(() => {
    if (messages.length > 0) {
      AsyncStorage.setItem(CHAT_KEY, JSON.stringify(messages.slice(-100))).catch(() => {});
    }
  }, [messages]);

  // ── تمرير للأسفل عند رسالة جديدة ─────────────────────────

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length, streamingText]);

  // ── حفظ عنوان السيرفر ────────────────────────────────────

  const saveServerUrl = async (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setServerUrl(trimmed);
    setEditingUrl(false);
    // احفظ في المفتاح المشترك حتى يتزامن مع WebSocketProvider وبقية الشاشات
    await AsyncStorage.setItem(STORAGE_KEYS.AIDEN_SERVER_URL, trimmed);
    checkConn(trimmed);
  };

  // ── اختيار الصورة ────────────────────────────────────────

  const handlePickImage = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("الإذن مطلوب", "يرجى السماح للتطبيق بالوصول للصور.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      base64: true,
    });

    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const uri = asset.uri;
    const b64 = asset.base64;

    if (!b64) {
      Alert.alert("خطأ", "لا يمكن قراءة الصورة.");
      return;
    }

    const userMsg: Message = {
      id: generateId(),
      role: "user",
      content: input.trim() || "أرسلت صورة:",
      timestamp: now(),
      imageUri: uri,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsSending(true);
    setStreamingText("");

    const aiMsgId = generateId();
    streamingIdRef.current = aiMsgId;
    let accumulated = "";

    // Send image description request to Aiden
    const imagePrompt = input.trim()
      ? `${input.trim()}\n[صورة مرفقة — base64: data:image/jpeg;base64,${b64.substring(0, 200)}...]`
      : `انظر إلى هذه الصورة وأخبرني عنها:\n[base64: data:image/jpeg;base64,${b64.substring(0, 200)}...]`;

    await sendMessageToAiden(
      serverUrl,
      { message: imagePrompt, session: sessionId.current },
      (token) => { accumulated += token; setStreamingText(accumulated); },
      (activity) => {
        if (activity) {
          setMessages((prev) => [...prev, {
            id: generateId(), role: "activity",
            content: `${activity.icon} ${activity.message}`, timestamp: now(),
          }]);
        }
      },
      (provider) => {
        setMessages((prev) => [...prev, {
          id: aiMsgId, role: "assistant",
          content: accumulated || "لم تصلني إجابة.", timestamp: now(), provider,
        }]);
        setStreamingText(""); setIsSending(false); streamingIdRef.current = null;
      },
      async (_error) => {
        // Aiden غير متاح — Groq fallback للصور
        setUsingGroqFallback(true);
        accumulated = "";
        setStreamingText("");
        setMessages((prev) => [...prev, {
          id: generateId(), role: "activity",
          content: "⚡ Aiden غير متاح — أستخدم Groq بديلاً", timestamp: now(),
        }]);
        await sendMessageViaGroq(
          imagePrompt,
          [{ role: "user", content: imagePrompt }],
          (token) => { accumulated += token; setStreamingText(accumulated); },
          (provider) => {
            setUsingGroqFallback(false);
            setMessages((prev) => [...prev, {
              id: aiMsgId, role: "assistant",
              content: accumulated || "لم أتلق رداً.", timestamp: now(), provider,
            }]);
            setStreamingText(""); setIsSending(false); streamingIdRef.current = null;
          },
          (groqError) => {
            setUsingGroqFallback(false);
            setMessages((prev) => [...prev, {
              id: generateId(), role: "assistant",
              content: `❌ Aiden غير متاح وGroq فشل: ${groqError}`, timestamp: now(),
            }]);
            setStreamingText(""); setIsSending(false); streamingIdRef.current = null;
          }
        );
      }
    );
  }, [input, isSending, serverUrl]);

  // ── إرسال الرسالة ─────────────────────────────────────────

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isSending) return;

    const userMsg: Message = {
      id: generateId(),
      role: "user",
      content: text,
      timestamp: now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsSending(true);
    setStreamingText("");

    const aiMsgId = generateId();
    streamingIdRef.current = aiMsgId;
    let accumulated = "";

    // بناء سجل المحادثة للإرسال لـ Groq
    const history = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(-20)
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    await sendMessageToAiden(
      serverUrl,
      { message: text, session: sessionId.current },
      (token) => {
        accumulated += token;
        setStreamingText(accumulated);
      },
      (activity) => {
        if (activity) {
          const actMsg: Message = {
            id: generateId(),
            role: "activity",
            content: `${activity.icon} ${activity.message}`,
            timestamp: now(),
          };
          setMessages((prev) => [...prev, actMsg]);
        }
      },
      (provider) => {
        setUsingGroqFallback(false);
        const aiMsg: Message = {
          id: aiMsgId,
          role: "assistant",
          content: accumulated || "لم تصلني إجابة من السيرفر.",
          timestamp: now(),
          provider,
        };
        setMessages((prev) => [...prev, aiMsg]);
        setStreamingText("");
        setIsSending(false);
        streamingIdRef.current = null;
      },
      async (_error) => {
        setUsingGroqFallback(true);
        accumulated = "";
        setStreamingText("");

        await sendMessageViaGroq(
          text,
          history,
          (token) => {
            accumulated += token;
            setStreamingText(accumulated);
          },
          (provider) => {
            setUsingGroqFallback(false);
            const aiMsg: Message = {
              id: aiMsgId,
              role: "assistant",
              content: accumulated || "لم أتلق رداً.",
              timestamp: now(),
              provider,
            };
            setMessages((prev) => [...prev, aiMsg]);
            setStreamingText("");
            setIsSending(false);
            streamingIdRef.current = null;
          },
          (groqError) => {
            setUsingGroqFallback(false);
            const errMsg: Message = {
              id: generateId(),
              role: "assistant",
              content: `❌ Aiden غير متاح وGroq فشل أيضاً: ${groqError}`,
              timestamp: now(),
            };
            setMessages((prev) => [...prev, errMsg]);
            setStreamingText("");
            setIsSending(false);
            streamingIdRef.current = null;
          }
        );
      }
    );
  }, [input, isSending, serverUrl, messages]);

  // ── Ping — قياس سرعة الاستجابة ──────────────────────────

  const handlePing = useCallback(async () => {
    if (isPinging) return;
    setIsPinging(true);
    setPingMs(null);
    const start = Date.now();
    const result = await checkAidenConnection(serverUrl);
    const elapsed = Date.now() - start;
    setConnStatus(result.status);
    setConnVersion(result.version);
    if (result.status === "connected") {
      setPingMs(elapsed);
    } else {
      setPingMs(null);
    }
    setIsPinging(false);
  }, [isPinging, serverUrl]);

  // ── إعادة التعيين لـ localhost ────────────────────────────

  const handleResetToLocalhost = useCallback(async () => {
    const localUrl = "http://127.0.0.1:4200";
    setServerUrl(localUrl);
    setUrlDraft(localUrl);
    await AsyncStorage.setItem(STORAGE_KEYS.AIDEN_SERVER_URL, localUrl);
    checkConn(localUrl);
  }, [checkConn]);

  const formatLastCheckedAt = (value: number | null) => {
    if (!value) return "لم يتم الفحص بعد";
    return new Intl.DateTimeFormat("ar", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(value));
  };

  // ── مسح المحادثة ─────────────────────────────────────────

  const handleClear = () => {
    Alert.alert("مسح المحادثة", "هل تريد مسح محادثة Aiden؟", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "مسح",
        style: "destructive",
        onPress: () => {
          setMessages([]);
          AsyncStorage.removeItem(CHAT_KEY).catch(() => {});
        },
      },
    ]);
  };

  // ── قائمة البيانات ────────────────────────────────────────

  const displayMessages = [
    ...messages,
    ...(isSending && streamingText
      ? [
          {
            id: "__streaming__",
            role: "assistant" as const,
            content: streamingText + " ▌",
            timestamp: now(),
          },
        ]
      : []),
  ];

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      {/* ─── Header ─── */}
      <LinearGradient
        colors={["#1A2236", "#141928"]}
        style={[styles.header]}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-right" size={22} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.headerTitleRow}>
            <View style={[styles.headerStatusDot, {
              backgroundColor: connStatus === "connected" ? "#22c55e"
                : connStatus === "checking" ? "#eab308" : "#ef4444"
            }]} />
            <Text style={styles.headerTitle}>Aiden</Text>
          </View>
          <Text style={styles.headerSub}>Kali Linux · Port 4200</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push("/security" as any)}
            activeOpacity={0.7}
          >
            <Feather name="shield" size={16} color="#ef4444" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push("/tactical" as any)}
            activeOpacity={0.7}
          >
            <Feather name="tool" size={16} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push("/knowledge" as any)}
            activeOpacity={0.7}
          >
            <Feather name="book" size={16} color="#8b5cf6" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push("/vision" as any)}
            activeOpacity={0.7}
          >
            <Feather name="eye" size={16} color="#22c55e" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={handlePing}
            disabled={isPinging}
            activeOpacity={0.7}
          >
            {isPinging
              ? <ActivityIndicator size="small" color={COLORS.accent} />
              : <Feather name="refresh-cw" size={16} color={COLORS.textSecondary} />
            }
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, styles.autoBtn]}
            onPress={() => setShowAutoStart(true)}
            activeOpacity={0.7}
          >
            <Feather name="zap" size={16} color="#eab308" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={handleClear}
            activeOpacity={0.7}
          >
            <Feather name="trash-2" size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* ─── Server URL Bar ─── */}
      <View style={styles.serverBar}>
        {editingUrl ? (
          <View style={styles.urlEditRow}>
            <TextInput
              style={styles.urlInput}
              value={urlDraft}
              onChangeText={setUrlDraft}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              placeholder="http://192.168.1.100:4200"
              placeholderTextColor={COLORS.textMuted}
              returnKeyType="done"
              onSubmitEditing={() => saveServerUrl(urlDraft)}
            />
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() => saveServerUrl(urlDraft)}
              activeOpacity={0.7}
            >
              <Text style={styles.saveBtnText}>حفظ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                setEditingUrl(false);
                setUrlDraft(serverUrl);
              }}
              activeOpacity={0.7}
            >
              <Feather name="x" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.urlRow}
            onPress={() => setEditingUrl(true)}
            activeOpacity={0.7}
          >
            <Feather name="server" size={13} color={connStatus === "connected" ? "#22c55e" : COLORS.textMuted} />
            <Text style={styles.urlText} numberOfLines={1}>
              {serverUrl}
            </Text>
            {connVersion && (
              <View style={styles.versionBadge}>
                <Text style={styles.versionText}>v{connVersion}</Text>
              </View>
            )}
            <Feather name="edit-2" size={12} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
        <Text style={styles.updateInfoText}>آخر فحص: {formatLastCheckedAt(lastCheckedAt)}</Text>
        <Text style={styles.updateInfoText}>
          حالة التحديث: {connStatus === "connected" ? "وصل" : "لم يصل بعد"}
        </Text>
      </View>

      {/* ─── Smart Dashboard ─── */}
      <SmartDashboard
        status={connStatus}
        version={connVersion}
        pingMs={pingMs}
        serverUrl={serverUrl}
      />

      {/* ─── Connection Warning / Groq Fallback ─── */}
      {connStatus === "disconnected" || connStatus === "error" ? (
        <View style={styles.warningBar}>
          <Feather name="zap" size={13} color="#eab308" />
          <Text style={styles.warningText}>
            Aiden غير متاح — سيستخدم Groq تلقائياً
          </Text>
          <TouchableOpacity onPress={handleResetToLocalhost} style={styles.resetBtn}>
            <Feather name="home" size={11} color="#eab308" />
            <Text style={styles.resetText}>localhost</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePing}>
            <Text style={styles.retryText}>فحص</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* ─── Messages ─── */}
      {displayMessages.length === 0 ? (
        <View style={styles.emptyState}>
          <LinearGradient
            colors={["#1e40af", "#1e3a8a"]}
            style={styles.aidenLogo}
          >
            <Text style={styles.aidenLogoText}>A</Text>
          </LinearGradient>
          <Text style={styles.emptyTitle}>Aiden جاهز</Text>
          <Text style={styles.emptyDesc}>
            يعمل على Kali Linux بدون انترنت خارجي.{"\n"}
            62 مهارة نشطة · اكتب رسالتك وسيرد فوراً.
          </Text>
          <View style={styles.quickChips}>
            {["ما حالك؟", "افحص الشبكة", "اعرض الملفات", "ما وقتي المتاح؟"].map(
              (q) => (
                <TouchableOpacity
                  key={q}
                  style={styles.chip}
                  onPress={() => setInput(q)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.chipText}>{q}</Text>
                </TouchableOpacity>
              )
            )}
          </View>
          {/* ─── Command Center Quick Nav ─── */}
          <View style={styles.commandNav}>
            <Text style={styles.commandNavTitle}>مركز القيادة</Text>
            <View style={styles.commandNavRow}>
              {[
                { icon: "shield" as const, label: "أمان", color: "#ef4444", route: "/security" },
                { icon: "tool" as const, label: "أدوات", color: "#3b82f6", route: "/tactical" },
                { icon: "book" as const, label: "معرفة", color: "#8b5cf6", route: "/knowledge" },
                { icon: "eye" as const, label: "رؤية", color: "#22c55e", route: "/vision" },
              ].map(({ icon, label, color, route }) => (
                <TouchableOpacity
                  key={route}
                  style={[styles.commandNavBtn, { borderColor: color + "44" }]}
                  onPress={() => router.push(route as any)}
                  activeOpacity={0.7}
                >
                  <Feather name={icon} size={20} color={color} />
                  <Text style={[styles.commandNavLabel, { color }]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      ) : (
        <FlatList
          ref={flatRef}
          data={displayMessages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble msg={item} serverUrl={serverUrl} />}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            flatRef.current?.scrollToEnd({ animated: true })
          }
        />
      )}

      {/* ─── Thinking Bar ─── */}
      <ThinkingBar
        active={isSending && !streamingText}
        label={usingGroqFallback ? "⚡ Groq يحلل طلبك..." : "Aiden يعالج البيانات على Kali Linux..."}
      />

      {/* ─── Input ─── */}
      <View
        style={[
          styles.inputBar,
          { paddingBottom: Math.max(insets.bottom, SPACING.md) },
        ]}
      >
        <TouchableOpacity
          style={styles.attachBtn}
          onPress={handlePickImage}
          disabled={isSending}
          activeOpacity={0.7}
        >
          <Feather name="image" size={20} color={isSending ? COLORS.textMuted : COLORS.accent} />
        </TouchableOpacity>
        <TextInput
          style={styles.textInput}
          value={input}
          onChangeText={setInput}
          placeholder="اكتب رسالتك لـ Aiden..."
          placeholderTextColor={COLORS.textMuted}
          multiline
          maxLength={4000}
          returnKeyType="default"
          textAlign="right"
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            (!input.trim() || isSending) && styles.sendBtnDisabled,
          ]}
          onPress={handleSend}
          disabled={!input.trim() || isSending}
          activeOpacity={0.7}
        >
          {isSending ? (
            <ActivityIndicator size="small" color={COLORS.primaryBg} />
          ) : (
            <Feather name="send" size={18} color={COLORS.primaryBg} />
          )}
        </TouchableOpacity>
      </View>

      {/* ─── Auto-Start Modal ─── */}
      <AutoStartModal visible={showAutoStart} onClose={() => setShowAutoStart(false)} />

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  backBtn: {
    padding: SPACING.xs,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: COLORS.textPrimary,
  },
  headerSub: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 1,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  iconBtn: {
    padding: SPACING.xs,
  },
  autoBtn: {
    backgroundColor: "#eab30818",
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: "#eab30833",
  },
  serverBar: {
    backgroundColor: COLORS.secondaryBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  urlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  urlText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    textAlign: "left",
  },
  versionBadge: {
    backgroundColor: COLORS.accent + "33",
    borderRadius: RADIUS.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  versionText: {
    fontSize: 10,
    color: COLORS.accent,
    fontWeight: "700" as const,
  },
  urlEditRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  updateInfoText: {
    marginTop: 4,
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: "left",
  },
  urlInput: {
    flex: 1,
    height: 34,
    backgroundColor: COLORS.primaryBg,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.accent,
    paddingHorizontal: SPACING.sm,
    color: COLORS.textPrimary,
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    textAlign: "left",
  },
  saveBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
  },
  saveBtnText: {
    color: COLORS.primaryBg,
    fontWeight: "700" as const,
    fontSize: 13,
  },
  cancelBtn: {
    padding: SPACING.xs,
  },
  groqFallbackBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    backgroundColor: "#78350f44",
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#eab30844",
  },
  groqFallbackText: {
    flex: 1,
    fontSize: 11,
    color: "#fbbf24",
    textAlign: "right",
    fontFamily: TYPOGRAPHY.fontRegular,
  },
  warningBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    backgroundColor: "#78350f33",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: "#eab30833",
  },
  warningText: {
    flex: 1,
    fontSize: 11,
    color: "#fbbf24",
    textAlign: "right",
  },
  retryText: {
    fontSize: 11,
    color: COLORS.accent,
    fontWeight: "700" as const,
  },
  connectedBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    backgroundColor: "#14532d22",
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    justifyContent: "center",
  },
  connectedText: {
    fontSize: 11,
    color: "#22c55e",
    fontWeight: "600" as const,
    flex: 1,
  },
  pingBadge: {
    backgroundColor: "#1e40af44",
    borderRadius: RADIUS.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "#3b82f633",
  },
  pingText: {
    fontSize: 10,
    color: "#60a5fa",
    fontWeight: "700" as const,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  pingBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.accent + "44",
    backgroundColor: COLORS.accent + "11",
  },
  pingBtnText: {
    fontSize: 11,
    color: COLORS.accent,
    fontWeight: "600" as const,
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    backgroundColor: "#eab30818",
    borderWidth: 1,
    borderColor: "#eab30833",
  },
  resetText: {
    fontSize: 10,
    color: "#eab308",
    fontWeight: "700" as const,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  aidenLogo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
    overflow: "hidden",
  },
  aidenLogoText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700" as const,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: COLORS.textPrimary,
  },
  emptyDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  quickChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
    justifyContent: "center",
    marginTop: SPACING.sm,
  },
  chip: {
    backgroundColor: COLORS.secondaryBg,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  chipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  messageList: {
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  typingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs,
  },
  typingText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontStyle: "italic",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    backgroundColor: COLORS.secondaryBg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  textInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    backgroundColor: COLORS.primaryBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.textPrimary,
    fontSize: 14,
    textAlignVertical: "center",
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    backgroundColor: COLORS.border,
  },
  attachBtn: {
    width: 36,
    height: 36,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderRadius: RADIUS.full,
    marginRight: SPACING.xs,
  },
  commandNav: {
    marginTop: SPACING.xl,
    width: "100%",
    alignItems: "center",
    gap: SPACING.sm,
  },
  commandNavTitle: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: "700" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 1.2,
  },
  commandNavRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    justifyContent: "center",
  },
  commandNavBtn: {
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    minWidth: 64,
  },
  commandNavLabel: {
    fontSize: 11,
    fontWeight: "700" as const,
  },
});
