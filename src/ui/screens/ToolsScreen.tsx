import React, { useState, useCallback } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { ALL_TOOLS } from "../../tools";
import { useToolsStore } from "../../store/tools.store";
import { COLORS } from "../theme/colors";
import { SPACING, RADIUS } from "../theme/spacing";
import { TYPOGRAPHY } from "../theme/typography";
import type { ToolStatus } from "../../types/tool.types";

interface DiagnosticResult {
  toolName: string;
  passed: boolean;
  message: string;
  durationMs: number;
}

interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
}

const TOOL_CATEGORIES = [
  { label: "الاتصالات", icon: "phone" as const, color: "#4CAF75", tools: ["call", "send_message", "contacts", "share"] },
  { label: "الوسائط", icon: "camera" as const, color: "#E0925C", tools: ["camera", "gallery", "audio_record", "speech_output"] },
  { label: "الموقع", icon: "map-pin" as const, color: "#5C9DE0", tools: ["location", "maps"] },
  { label: "الإنتاجية", icon: "check-square" as const, color: "#D4A853", tools: ["reminder", "notification", "calendar", "notes"] },
  { label: "الويب", icon: "globe" as const, color: "#9C5CE0", tools: ["web_search", "browser"] },
  { label: "التطبيقات", icon: "grid" as const, color: "#E05C8E", tools: ["open_app", "app_aliases"] },
  { label: "الملفات", icon: "folder" as const, color: "#5CE0D4", tools: ["files"] },
];

const TOOL_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  call: "phone", send_message: "message-circle", contacts: "users", share: "share-2",
  camera: "camera", gallery: "image", audio_record: "mic", speech_output: "volume-2",
  location: "map-pin", maps: "map",
  reminder: "bell", notification: "bell", calendar: "calendar", notes: "edit-3",
  web_search: "search", browser: "globe",
  open_app: "grid", app_aliases: "list",
  files: "folder",
};

function getStatusColor(status: ToolStatus | "passed" | "failed"): string {
  if (status === "passed" || status === "success") return COLORS.success;
  if (status === "failed" || status === "error") return COLORS.error;
  if (status === "running") return COLORS.accent;
  if (status === "permission_denied") return COLORS.warning;
  return COLORS.textMuted;
}

function getStatusLabel(status: ToolStatus): string {
  switch (status) {
    case "success": return "✓ نجح";
    case "error": return "✗ فشل";
    case "running": return "⟳ يختبر";
    case "permission_denied": return "! محظور";
    case "not_available": return "غير متاح";
    default: return "جاهز";
  }
}

async function runToolDiagnostic(toolName: string): Promise<DiagnosticResult> {
  const start = Date.now();
  const tool = ALL_TOOLS.find((t) => t.name === toolName);

  if (!tool) {
    return { toolName, passed: false, message: "الأداة غير موجودة", durationMs: Date.now() - start };
  }

  try {
    if (!tool.name || typeof tool.name !== "string") {
      return { toolName, passed: false, message: "اسم الأداة غير صالح", durationMs: Date.now() - start };
    }
    if (!tool.intent || typeof tool.intent !== "string") {
      return { toolName, passed: false, message: "نية الأداة غير صالحة", durationMs: Date.now() - start };
    }
    if (typeof tool.execute !== "function") {
      return { toolName, passed: false, message: "دالة التنفيذ غير موجودة", durationMs: Date.now() - start };
    }

    const testCtx = {
      intent: tool.intent,
      entities: {},
      originalText: "اختبار",
      userId: "diagnostic",
    };
    const result = await tool.execute(testCtx);

    if (result === null || result === undefined) {
      return { toolName, passed: false, message: "لا يوجد ناتج للأداة", durationMs: Date.now() - start };
    }

    if (typeof result.success !== "boolean") {
      return { toolName, passed: false, message: "ناتج غير صالح", durationMs: Date.now() - start };
    }

    const durationMs = Date.now() - start;
    return {
      toolName,
      passed: true,
      message: result.message || "تم التحقق بنجاح",
      durationMs,
    };
  } catch (err) {
    return {
      toolName,
      passed: false,
      message: err instanceof Error ? err.message : "خطأ غير متوقع",
      durationMs: Date.now() - start,
    };
  }
}

export function ToolsScreen() {
  const { toolStates, setToolStatus, resetAll } = useToolsStore();
  const insets = useSafeAreaInsets();
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [summary, setSummary] = useState<TestSummary | null>(null);
  const [tested, setTested] = useState(false);

  const runAllTests = useCallback(async () => {
    setRunning(true);
    setTested(true);
    setSummary(null);
    setResults([]);
    resetAll();
    const overallStart = Date.now();
    const newResults: DiagnosticResult[] = [];

    for (const tool of ALL_TOOLS) {
      setToolStatus(tool.name, "running", "يختبر...");
      const result = await runToolDiagnostic(tool.name);
      newResults.push(result);
      setResults([...newResults]);
      setToolStatus(
        tool.name,
        result.passed ? "success" : "error",
        result.message
      );
    }

    const passed = newResults.filter((r) => r.passed).length;
    setSummary({
      total: newResults.length,
      passed,
      failed: newResults.length - passed,
      durationMs: Date.now() - overallStart,
    });
    setRunning(false);
  }, [resetAll, setToolStatus]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + SPACING.xl },
      ]}
    >
      {/* Header */}
      <View style={styles.headerSection}>
        <Text style={styles.header}>الأدوات ({ALL_TOOLS.length})</Text>
        <Text style={styles.subtitle}>
          يستخدم الحسن هذه الأدوات لتنفيذ أوامرك مباشرة على جهازك
        </Text>
      </View>

      {/* Test Button */}
      <TouchableOpacity
        style={[styles.testBtn, running && styles.testBtnRunning]}
        onPress={runAllTests}
        disabled={running}
        activeOpacity={0.8}
      >
        {running ? (
          <ActivityIndicator color={COLORS.primaryBg} size="small" />
        ) : (
          <Feather name="play-circle" size={18} color={COLORS.primaryBg} />
        )}
        <Text style={styles.testBtnText}>
          {running ? "جاري الاختبار..." : tested ? "إعادة الاختبار" : "اختبار جميع الأدوات"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.codeSignBtn}
        onPress={() => router.push("./codesign" as any)}
        activeOpacity={0.8}
      >
        <Feather name="layout" size={18} color={COLORS.primaryBg} />
        <Text style={styles.codeSignBtnText}>Open CoDesign</Text>
      </TouchableOpacity>

      {/* Aiden Command Center */}
      <View style={styles.aidenSection}>
        <Text style={styles.aidenSectionTitle}>مركز قيادة Aiden</Text>
        <View style={styles.aidenGrid}>
          {[
            { icon: "shield" as const, label: "Security Dashboard", color: "#ef4444", route: "/security" },
            { icon: "tool" as const, label: "Tactical Toolbox\n62 مهارة", color: "#3b82f6", route: "/tactical" },
            { icon: "book" as const, label: "Knowledge Vault", color: "#8b5cf6", route: "/knowledge" },
            { icon: "eye" as const, label: "Vision Intelligence", color: "#22c55e", route: "/vision" },
          ].map(({ icon, label, color, route }) => (
            <TouchableOpacity
              key={route}
              style={[styles.aidenCard, { borderColor: color + "44" }]}
              onPress={() => router.push(route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.aidenCardIcon, { backgroundColor: color + "22" }]}>
                <Feather name={icon} size={22} color={color} />
              </View>
              <Text style={[styles.aidenCardLabel, { color }]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Summary Card */}
      {summary && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryBadge, { backgroundColor: COLORS.successGlow }]}>
              <Feather name="check-circle" size={14} color={COLORS.success} />
              <Text style={[styles.summaryNum, { color: COLORS.success }]}>{summary.passed}</Text>
              <Text style={[styles.summaryLabel, { color: COLORS.success }]}>نجح</Text>
            </View>
            <View style={[styles.summaryBadge, { backgroundColor: COLORS.errorGlow }]}>
              <Feather name="x-circle" size={14} color={COLORS.error} />
              <Text style={[styles.summaryNum, { color: COLORS.error }]}>{summary.failed}</Text>
              <Text style={[styles.summaryLabel, { color: COLORS.error }]}>فشل</Text>
            </View>
            <View style={[styles.summaryBadge, { backgroundColor: COLORS.accentGlow }]}>
              <Feather name="layers" size={14} color={COLORS.accent} />
              <Text style={[styles.summaryNum, { color: COLORS.accent }]}>{summary.total}</Text>
              <Text style={[styles.summaryLabel, { color: COLORS.accent }]}>إجمالي</Text>
            </View>
          </View>
          <Text style={styles.summaryTime}>
            اكتمل في {(summary.durationMs / 1000).toFixed(1)} ثانية
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.round((summary.passed / summary.total) * 100)}%` as any,
                  backgroundColor: summary.failed === 0 ? COLORS.success : COLORS.warning,
                },
              ]}
            />
          </View>
          <Text style={styles.progressPct}>
            {Math.round((summary.passed / summary.total) * 100)}% نسبة النجاح
          </Text>
        </View>
      )}

      {/* Tools by Category */}
      {TOOL_CATEGORIES.map((category) => {
        const categoryTools = ALL_TOOLS.filter((t) => category.tools.includes(t.name));
        if (categoryTools.length === 0) return null;

        return (
          <View key={category.label} style={styles.category}>
            <View style={styles.categoryHeader}>
              <View style={[styles.categoryIcon, { backgroundColor: category.color + "22" }]}>
                <Feather name={category.icon} size={16} color={category.color} />
              </View>
              <Text style={styles.categoryTitle}>{category.label}</Text>
            </View>

            <View style={styles.toolsGrid}>
              {categoryTools.map((tool) => {
                const state = toolStates.find((s) => s.name === tool.name);
                const status = state?.status ?? "idle";
                const icon = TOOL_ICONS[tool.name] ?? "tool";
                const result = results.find((r) => r.toolName === tool.name);

                return (
                  <View
                    key={tool.name}
                    style={[
                      styles.toolCard,
                      status === "success" && styles.toolCardSuccess,
                      status === "error" && styles.toolCardError,
                      status === "running" && styles.toolCardRunning,
                    ]}
                  >
                    <View style={[styles.toolIcon, { backgroundColor: category.color + "15" }]}>
                      {status === "running" ? (
                        <ActivityIndicator size="small" color={COLORS.accent} />
                      ) : (
                        <Feather name={icon} size={20} color={category.color} />
                      )}
                    </View>
                    <Text style={styles.toolName}>{tool.description}</Text>
                    <View style={styles.toolMeta}>
                      {tool.requiresPermission && (
                        <View style={styles.permBadge}>
                          <Feather name="lock" size={10} color={COLORS.warning} />
                          <Text style={styles.permText}>صلاحية</Text>
                        </View>
                      )}
                      <View style={[styles.statusDot, { backgroundColor: getStatusColor(status) }]} />
                      <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
                        {getStatusLabel(status)}
                      </Text>
                    </View>
                    {result && (
                      <Text style={[styles.resultMsg, { color: result.passed ? COLORS.success : COLORS.error }]} numberOfLines={2}>
                        {result.message}
                      </Text>
                    )}
                    {result && (
                      <Text style={styles.durationText}>{result.durationMs}ms</Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}

      {/* Developer Credit */}
      <View style={styles.devSection}>
        <Text style={styles.devLabel}>برمجة وتطوير</Text>
        <Text style={styles.devName}>وهيب عساج</Text>
        <Text style={styles.devVersion}>الإصدار 1.0.0 • {ALL_TOOLS.length} أداة</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primaryBg },
  content: { padding: SPACING.lg },
  headerSection: { marginBottom: SPACING.lg },
  header: {
    fontSize: TYPOGRAPHY.xl,
    color: COLORS.textPrimary,
    fontWeight: "bold" as const,
    marginBottom: SPACING.xs,
    textAlign: "right",
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textMuted,
    textAlign: "right",
    lineHeight: TYPOGRAPHY.lineHeightMd,
  },
  testBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.lg,
  },
  testBtnRunning: { backgroundColor: COLORS.accentDark },
  testBtnText: {
    fontSize: TYPOGRAPHY.md,
    color: COLORS.primaryBg,
    fontWeight: "700" as const,
  },
  codeSignBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.success,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.lg,
  },
  codeSignBtnText: {
    fontSize: TYPOGRAPHY.md,
    color: COLORS.primaryBg,
    fontWeight: "700" as const,
  },
  summaryCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  summaryBadge: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  summaryNum: { fontSize: TYPOGRAPHY.lg, fontWeight: "bold" as const },
  summaryLabel: { fontSize: TYPOGRAPHY.xs },
  summaryTime: { textAlign: "center", fontSize: TYPOGRAPHY.xs, color: COLORS.textMuted },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 3 },
  progressPct: { textAlign: "center", fontSize: TYPOGRAPHY.xs, color: COLORS.textSecondary },
  category: { marginBottom: SPACING.xl },
  categoryHeader: {
    flexDirection: "row-reverse" as const,
    alignItems: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
    justifyContent: "flex-end",
  },
  categoryIcon: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryTitle: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    fontWeight: "600" as const,
    textAlign: "right",
  },
  toolsGrid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm },
  toolCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: "48%",
    gap: 4,
  },
  toolCardSuccess: {
    borderColor: COLORS.success,
    backgroundColor: "rgba(76,175,125,0.06)",
  },
  toolCardError: {
    borderColor: COLORS.error,
    backgroundColor: "rgba(224,92,92,0.06)",
  },
  toolCardRunning: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentGlow,
  },
  toolIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  toolName: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textPrimary,
    fontWeight: "600" as const,
    textAlign: "right",
  },
  toolMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: SPACING.xs,
  },
  permBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: COLORS.warningGlow,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 1,
    borderRadius: RADIUS.sm,
  },
  permText: { fontSize: TYPOGRAPHY.xs, color: COLORS.warning },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: TYPOGRAPHY.xs },
  resultMsg: { fontSize: 10, textAlign: "right", marginTop: 2 },
  durationText: { fontSize: 9, color: COLORS.textMuted, textAlign: "right" },
  devSection: {
    alignItems: "center",
    paddingVertical: SPACING.xl,
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: SPACING.lg,
  },
  devLabel: { fontSize: TYPOGRAPHY.xs, color: COLORS.textMuted },
  devName: { fontSize: TYPOGRAPHY.md, color: COLORS.accent, fontWeight: "600" as const },
  devVersion: { fontSize: TYPOGRAPHY.xs, color: COLORS.textMuted },
  // ── Aiden Command Center ──────────────────────────────────
  aidenSection: {
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  aidenSectionTitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: "700" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 1.2,
    textAlign: "right",
  },
  aidenGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  aidenCard: {
    width: "48%",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
  },
  aidenCardIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
  },
  aidenCardLabel: {
    fontSize: 12,
    fontWeight: "700" as const,
    textAlign: "center",
    lineHeight: 18,
  },
});
