import React, { useRef } from "react";
import {
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Animated,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../theme/colors";
import { SPACING, RADIUS } from "../theme/spacing";
import { TYPOGRAPHY } from "../theme/typography";

interface QuickAction {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  message: string;
  color: string;
  bgColor: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: "كاميرا",   icon: "camera",         message: "افتح الكاميرا",              color: "#E8904A", bgColor: "rgba(232,144,74,0.14)" },
  { label: "موقعي",    icon: "map-pin",         message: "أين أنا؟",                   color: "#5B9BD5", bgColor: "rgba(91,155,213,0.14)" },
  { label: "تذكير",    icon: "bell",            message: "ذكرني بعد 30 دقيقة",         color: "#D4A853", bgColor: "rgba(212,168,83,0.14)"  },
  { label: "ملاحظة",   icon: "edit-3",          message: "اكتب ملاحظة",               color: "#4CAF7D", bgColor: "rgba(76,175,125,0.14)"  },
  { label: "بحث",      icon: "search",          message: "ابحث عن أحدث أخبار اليوم",  color: "#9C5CE0", bgColor: "rgba(156,92,224,0.14)"  },
  { label: "خرائط",    icon: "map",             message: "افتح الخرائط",               color: "#5B9BD5", bgColor: "rgba(91,155,213,0.14)"  },
  { label: "واتساب",   icon: "message-circle",  message: "افتح واتساب",               color: "#25D366", bgColor: "rgba(37,211,102,0.14)"  },
  { label: "يوتيوب",   icon: "play-circle",     message: "افتح يوتيوب",               color: "#FF0000", bgColor: "rgba(255,0,0,0.12)"      },
  { label: "اتصال",    icon: "phone",           message: "اتصل بـ ",                  color: "#4CAF7D", bgColor: "rgba(76,175,125,0.14)"  },
  { label: "تيك توك",  icon: "video",           message: "افتح تيك توك",              color: "#E85D8A", bgColor: "rgba(232,93,138,0.14)"  },
];

interface ChipProps {
  action: QuickAction;
  onPress: () => void;
}

function Chip({ action, onPress }: ChipProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.92, duration: 70, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={styles.chip}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        <View style={[styles.iconWrap, { backgroundColor: action.bgColor }]}>
          <Feather name={action.icon} size={15} color={action.color} />
        </View>
        <Text style={styles.chipText}>{action.label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

interface Props {
  onAction: (message: string) => void;
}

export function QuickActions({ onAction }: Props) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <View style={styles.labelLine} />
        <Text style={styles.label}>أوامر سريعة</Text>
        <View style={styles.labelLine} />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {QUICK_ACTIONS.map((action) => (
          <Chip
            key={action.label}
            action={action}
            onPress={() => onAction(action.message)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  labelLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  label: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    textAlign: "center",
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
    gap: SPACING.sm,
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
});
