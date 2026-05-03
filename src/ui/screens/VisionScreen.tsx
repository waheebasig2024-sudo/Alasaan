// ============================================================
// Vision Intelligence — تحليل بصري بـ Aiden v3.18.0
// Camera · Gallery · Screen Analysis
// ============================================================

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "../theme/colors";
import { SPACING, RADIUS } from "../theme/spacing";
import { STORAGE_KEYS } from "../../constants/storage-keys";
import { AIDEN_DEFAULT_URL } from "../../config/aiden.config";

type AnalysisMode = "error" | "code" | "general" | "security";

interface AnalysisResult {
  mode: AnalysisMode;
  analysis: string;
  suggestions: string[];
  severity?: "low" | "medium" | "high" | "critical";
  timestamp: number;
}

const MODE_CONFIG: Record<AnalysisMode, { label: string; icon: string; color: string; prompt: string }> = {
  error: {
    label: "تحليل الأخطاء",
    icon: "alert-triangle",
    color: "#ef4444",
    prompt: "حلل هذه الصورة وحدد الأخطاء البرمجية أو terminal errors وقدم حلولاً فورية",
  },
  code: {
    label: "مراجعة الكود",
    icon: "code",
    color: "#3b82f6",
    prompt: "راجع الكود في هذه الصورة واقترح تحسينات وأصلح أي مشاكل",
  },
  security: {
    label: "فحص أمني",
    icon: "shield",
    color: "#f97316",
    prompt: "افحص هذه الصورة من منظور أمني وحدد أي ثغرات أو مخاطر محتملة",
  },
  general: {
    label: "تحليل عام",
    icon: "eye",
    color: "#8b5cf6",
    prompt: "حلل هذه الصورة وقدم وصفاً شاملاً ومعلومات مفيدة",
  },
};

async function analyzeImageWithAiden(
  serverUrl: string,
  imageBase64: string,
  mode: AnalysisMode,
  onToken: (t: string) => void,
  onDone: () => void,
): Promise<void> {
  const base = serverUrl.replace(/\/$/, "");
  const prompt = MODE_CONFIG[mode].prompt;

  try {
    const res = await fetch(`${base}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream,application/json",
      },
      body: JSON.stringify({
        message: prompt,
        image: imageBase64,
        session: `vision-${mode}`,
        mode: "stream",
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) {
      onToken(`[Error] HTTP ${res.status}`);
      onDone();
      return;
    }

    const ct = res.headers.get("content-type") ?? "";
    if (ct.includes("application/json") && !ct.includes("event-stream")) {
      const data = await res.json();
      onToken(data.message ?? data.response ?? "");
      onDone();
      return;
    }

    const reader = res.body?.getReader();
    if (!reader) { onToken("[Error] No stream"); onDone(); return; }

    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === ":") continue;
        if (trimmed.startsWith("data: ")) {
          const jsonStr = trimmed.slice(6).trim();
          if (jsonStr === "[DONE]") { onDone(); return; }
          try {
            const chunk = JSON.parse(jsonStr);
            if (chunk.token) onToken(chunk.token);
            if (chunk.done) { onDone(); return; }
          } catch { /* skip */ }
        }
      }
    }
    onDone();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    onToken(`[Error] ${msg}`);
    onDone();
  }
}

export function VisionScreen() {
  const insets = useSafeAreaInsets();
  const [serverUrl, setServerUrl] = useState(AIDEN_DEFAULT_URL);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [mode, setMode] = useState<AnalysisMode>("error");
  const [analysisText, setAnalysisText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [done, setDone] = useState(false);

  React.useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.AIDEN_SERVER_URL).then((v) => {
      if (v) setServerUrl(v);
    });
  }, []);

  const pickFromGallery = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      setSelectedImage(asset.base64 ?? null);
      setAnalysisText("");
      setDone(false);
    }
  }, []);

  const pickFromCamera = useCallback(async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      setSelectedImage(asset.base64 ?? null);
      setAnalysisText("");
      setDone(false);
    }
  }, []);

  const runAnalysis = useCallback(async () => {
    if (!selectedImage) return;
    setAnalyzing(true);
    setAnalysisText("");
    setDone(false);

    await analyzeImageWithAiden(
      serverUrl,
      selectedImage,
      mode,
      (token) => setAnalysisText((prev) => prev + token),
      () => { setAnalyzing(false); setDone(true); }
    );
  }, [selectedImage, serverUrl, mode]);

  const modeConfig = MODE_CONFIG[mode];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient colors={["#0F1829", "#0B0F1A"]} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="arrow-right" size={22} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Vision Intelligence</Text>
          <Text style={styles.headerSub}>تحليل بصري بـ Aiden · Kali Linux</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Mode selector */}
        <Text style={styles.sectionLabel}>وضع التحليل</Text>
        <View style={styles.modeGrid}>
          {(Object.keys(MODE_CONFIG) as AnalysisMode[]).map((m) => {
            const cfg = MODE_CONFIG[m];
            const isActive = mode === m;
            return (
              <TouchableOpacity
                key={m}
                style={[styles.modeCard, isActive && { borderColor: cfg.color, backgroundColor: cfg.color + "18" }]}
                onPress={() => setMode(m)}
                activeOpacity={0.7}
              >
                <Feather name={cfg.icon as any} size={18} color={isActive ? cfg.color : COLORS.textMuted} />
                <Text style={[styles.modeLabel, isActive && { color: cfg.color }]}>{cfg.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Image picker */}
        <Text style={styles.sectionLabel}>الصورة</Text>
        <View style={styles.pickerRow}>
          <TouchableOpacity style={styles.pickerBtn} onPress={pickFromCamera} activeOpacity={0.7}>
            <Feather name="camera" size={22} color={COLORS.accent} />
            <Text style={styles.pickerLabel}>الكاميرا</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pickerBtn} onPress={pickFromGallery} activeOpacity={0.7}>
            <Feather name="image" size={22} color={COLORS.accent} />
            <Text style={styles.pickerLabel}>المعرض</Text>
          </TouchableOpacity>
        </View>

        {/* Image preview */}
        {imageUri && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
            <TouchableOpacity
              style={styles.clearImageBtn}
              onPress={() => { setImageUri(null); setSelectedImage(null); setAnalysisText(""); setDone(false); }}
              activeOpacity={0.7}
            >
              <Feather name="x" size={14} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* Analyze button */}
        {selectedImage && (
          <TouchableOpacity
            style={[styles.analyzeBtn, { backgroundColor: modeConfig.color }, analyzing && styles.analyzeBtnDisabled]}
            onPress={runAnalysis}
            disabled={analyzing}
            activeOpacity={0.7}
          >
            {analyzing
              ? <ActivityIndicator size="small" color="#fff" />
              : <Feather name={modeConfig.icon as any} size={18} color="#fff" />
            }
            <Text style={styles.analyzeBtnText}>
              {analyzing ? "Aiden يحلل..." : `تحليل — ${modeConfig.label}`}
            </Text>
          </TouchableOpacity>
        )}

        {/* Analysis output */}
        {(analysisText || analyzing) && (
          <View style={styles.resultContainer}>
            <View style={styles.resultHeader}>
              <View style={[styles.resultDot, { backgroundColor: modeConfig.color }]} />
              <Text style={[styles.resultTitle, { color: modeConfig.color }]}>
                تحليل Aiden — {modeConfig.label}
              </Text>
              {analyzing && <ActivityIndicator size="small" color={modeConfig.color} />}
            </View>
            <Text style={styles.resultText}>{analysisText}</Text>
            {!done && analyzing && <Text style={styles.cursorChar}>▌</Text>}
          </View>
        )}

        {/* Empty state */}
        {!selectedImage && !analysisText && (
          <View style={styles.emptyState}>
            <LinearGradient colors={[modeConfig.color + "33", modeConfig.color + "11"]} style={styles.emptyIcon}>
              <Feather name="camera" size={32} color={modeConfig.color} />
            </LinearGradient>
            <Text style={styles.emptyTitle}>Vision Intelligence</Text>
            <Text style={styles.emptyDesc}>
              التقط صورة أو اختر من المعرض{"\n"}
              وسيحللها Aiden فوراً بالذكاء الاصطناعي.{"\n"}
              {"\n"}يدعم تحليل: أخطاء Terminal · مراجعة كود{"\n"}
              فحص أمني · تحليل عام
            </Text>
          </View>
        )}

        <View style={{ height: 80 }} />
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
  headerTitle: { fontSize: 15, fontWeight: "700" as const, color: COLORS.textPrimary },
  headerSub: { fontSize: 10, color: COLORS.textMuted, marginTop: 1 },
  scroll: { flex: 1 },
  content: { padding: SPACING.md, gap: SPACING.md },
  sectionLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: "700" as const, textTransform: "uppercase" as const, letterSpacing: 1 },
  modeGrid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm },
  modeCard: {
    width: "48%",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modeLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: "600" as const },
  pickerRow: { flexDirection: "row", gap: SPACING.sm },
  pickerBtn: {
    flex: 1,
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.md,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.accent + "44",
    borderStyle: "dashed" as const,
  },
  pickerLabel: { fontSize: 13, color: COLORS.accent, fontWeight: "600" as const },
  imageContainer: {
    borderRadius: RADIUS.md,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  image: { width: "100%", height: 220 },
  clearImageBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: RADIUS.full,
    padding: 6,
  },
  analyzeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  analyzeBtnDisabled: { opacity: 0.6 },
  analyzeBtnText: { color: "#fff", fontWeight: "700" as const, fontSize: 14 },
  resultContainer: {
    backgroundColor: "#0a0e1a",
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: "#1E2A40",
    gap: SPACING.sm,
  },
  resultHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  resultDot: { width: 8, height: 8, borderRadius: 4 },
  resultTitle: { flex: 1, fontSize: 12, fontWeight: "700" as const },
  resultText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 22,
    textAlign: "right",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  cursorChar: {
    fontSize: 16,
    color: "#4ade80",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  emptyState: { alignItems: "center", gap: SPACING.lg, paddingVertical: SPACING.huge },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 18, color: COLORS.textPrimary, fontWeight: "700" as const },
  emptyDesc: { fontSize: 13, color: COLORS.textMuted, textAlign: "center", lineHeight: 22 },
});
