import React from "react";
import {
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../theme/colors";
import { SPACING, RADIUS } from "../theme/spacing";
import { TYPOGRAPHY } from "../theme/typography";

interface QuickAction {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  message: string;
  color?: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: "كاميرا", icon: "camera", message: "افتح الكاميرا", color: "#E0925C" },
  { label: "موقعي", icon: "map-pin", message: "أين أنا؟", color: "#5B9BD5" },
  { label: "تذكير", icon: "bell", message: "ذكرني بعد 30 دقيقة", color: "#D4A853" },
  { label: "ملاحظة", icon: "edit-3", message: "اكتب ملاحظة", color: "#4CAF7D" },
  { label: "بحث", icon: "search", message: "ابحث عن", color: "#9C5CE0" },
  { label: "خرائط", icon: "map", message: "افتح الخرائط", color: "#5B9BD5" },
  { label: "واتساب", icon: "message-circle", message: "افتح واتساب", color: "#4CAF7D" },
  { label: "يوتيوب", icon: "play-circle", message: "افتح يوتيوب", color: "#E05C5C" },
];

interface Props {
  onAction: (message: string) => void;
}

export function QuickActions({ onAction }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>اختر أمراً سريعاً</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {QUICK_ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.label}
            style={styles.chip}
            onPress={() => onAction(action.message)}
            activeOpacity={0.7}
          >
            <Feather name={action.icon} size={14} color={action.color ?? COLORS.accent} />
            <Text style={styles.chipText}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: SPACING.sm,
  },
  label: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
    textAlign: "center",
    marginBottom: SPACING.sm,
    letterSpacing: 0.5,
  },
  container: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    gap: SPACING.sm,
    flexDirection: "row",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    backgroundColor: COLORS.surfaceBg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
  },
});
