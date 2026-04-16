import React from "react";
import { ScrollView, View, Text, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { ALL_TOOLS } from "../../tools";
import { useToolsStore } from "../../store/tools.store";
import { COLORS } from "../theme/colors";
import { SPACING, RADIUS } from "../theme/spacing";
import { TYPOGRAPHY } from "../theme/typography";
import type { ToolStatus } from "../../types/tool.types";

interface ToolCategory {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  tools: string[];
}

const TOOL_CATEGORIES: ToolCategory[] = [
  {
    label: "الاتصالات",
    icon: "phone",
    color: "#4CAF75",
    tools: ["call", "contacts", "share"],
  },
  {
    label: "الوسائط",
    icon: "camera",
    color: "#E0925C",
    tools: ["camera", "gallery", "audio_record", "speech_output"],
  },
  {
    label: "الموقع والملاحة",
    icon: "map-pin",
    color: "#5C9DE0",
    tools: ["location", "maps"],
  },
  {
    label: "الإنتاجية",
    icon: "check-square",
    color: "#D4A853",
    tools: ["reminder", "notification", "calendar", "notes"],
  },
  {
    label: "الويب والتصفح",
    icon: "globe",
    color: "#9C5CE0",
    tools: ["web_search", "browser"],
  },
  {
    label: "التطبيقات",
    icon: "grid",
    color: "#E05C8E",
    tools: ["open_app", "app_aliases"],
  },
  {
    label: "الملفات",
    icon: "folder",
    color: "#5CE0D4",
    tools: ["files"],
  },
];

const TOOL_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  call: "phone",
  contacts: "users",
  share: "share-2",
  camera: "camera",
  gallery: "image",
  audio_record: "mic",
  speech_output: "volume-2",
  location: "map-pin",
  maps: "map",
  reminder: "bell",
  notification: "bell",
  calendar: "calendar",
  notes: "edit-3",
  web_search: "search",
  browser: "globe",
  open_app: "grid",
  app_aliases: "list",
  files: "folder",
};

function getStatusColor(status: ToolStatus): string {
  switch (status) {
    case "success": return COLORS.success;
    case "error": return COLORS.error;
    case "running": return COLORS.accent;
    case "permission_denied": return COLORS.warning;
    default: return COLORS.textMuted;
  }
}

function getStatusLabel(status: ToolStatus): string {
  switch (status) {
    case "success": return "مكتمل";
    case "error": return "خطأ";
    case "running": return "يعمل";
    case "permission_denied": return "محظور";
    case "not_available": return "غير متاح";
    default: return "جاهز";
  }
}

export function ToolsScreen() {
  const { toolStates } = useToolsStore();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + SPACING.xl },
      ]}
    >
      <View style={styles.headerSection}>
        <Text style={styles.header}>الأدوات ({ALL_TOOLS.length})</Text>
        <Text style={styles.subtitle}>
          يستخدم الحسن هذه الأدوات لتنفيذ أوامرك مباشرة على جهازك
        </Text>
      </View>

      {TOOL_CATEGORIES.map((category) => {
        const categoryTools = ALL_TOOLS.filter((t) =>
          category.tools.includes(t.name)
        );

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

                return (
                  <View key={tool.name} style={styles.toolCard}>
                    <View style={[styles.toolIcon, { backgroundColor: category.color + "15" }]}>
                      <Feather name={icon} size={20} color={category.color} />
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
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBg,
  },
  content: {
    padding: SPACING.lg,
  },
  headerSection: {
    marginBottom: SPACING.xl,
  },
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
  category: {
    marginBottom: SPACING.xl,
  },
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
  toolsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  toolCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: "48%",
    gap: SPACING.sm,
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
    backgroundColor: COLORS.warningGlow ?? "rgba(255,160,0,0.1)",
    paddingHorizontal: SPACING.xs,
    paddingVertical: 1,
    borderRadius: RADIUS.sm,
  },
  permText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.warning,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: TYPOGRAPHY.xs,
  },
});
