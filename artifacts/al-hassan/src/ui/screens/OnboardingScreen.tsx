import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSettings } from "../../providers/SettingsProvider";
import { setUserName } from "../../memory/personal-memory";
import { useSessionStore } from "../../store/session.store";
import { requestPermission } from "../../services/permissions.service";
import { COLORS } from "../theme/colors";
import { SPACING, RADIUS } from "../theme/spacing";
import { TYPOGRAPHY } from "../theme/typography";

interface OnboardingProps {
  onComplete: () => void;
}

const PERMISSIONS_TO_REQUEST = [
  { id: "notifications" as const, label: "الإشعارات", icon: "bell" as const, desc: "للتذكيرات والتنبيهات" },
  { id: "contacts" as const, label: "جهات الاتصال", icon: "users" as const, desc: "للاتصال والمراسلة" },
  { id: "location" as const, label: "الموقع", icon: "map-pin" as const, desc: "للملاحة والخرائط" },
  { id: "camera" as const, label: "الكاميرا", icon: "camera" as const, desc: "للتصوير والمسح" },
];

export function OnboardingScreen({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const { updateSettings } = useSettings();
  const { setOnboarded } = useSessionStore();
  const insets = useSafeAreaInsets();
  const [granted, setGranted] = useState<Record<string, boolean>>({});

  const handleNameNext = async () => {
    if (name.trim()) {
      await setUserName(name.trim());
      await updateSettings({ userName: name.trim() });
    }
    setStep(1);
  };

  const requestPerm = async (id: string) => {
    const result = await requestPermission(id as "notifications");
    setGranted((prev) => ({ ...prev, [id]: result }));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleFinish = async () => {
    await updateSettings({ onboardingComplete: true });
    setOnboarded(true);
    onComplete();
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Platform.OS === "web" ? 67 : insets.top + SPACING.xl,
          paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + SPACING.xl,
        },
      ]}
    >
      {step === 0 && (
        <ScrollView contentContainerStyle={styles.stepContent}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>ح</Text>
            </View>
          </View>
          <Text style={styles.title}>مرحباً بك في الحسن</Text>
          <Text style={styles.subtitle}>مساعدك الشخصي الذكي</Text>
          <Text style={styles.description}>
            الحسن يساعدك في تنفيذ المهام، والإجابة على الأسئلة، وحفظ المعلومات المهمة.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>ما اسمك؟ (اختياري)</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="اسمك..."
              placeholderTextColor={COLORS.textMuted}
              textAlign="right"
              autoFocus
            />
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={handleNameNext} activeOpacity={0.8}>
            <Text style={styles.primaryBtnText}>التالي</Text>
            <Feather name="arrow-left" size={20} color={COLORS.primaryBg} />
          </TouchableOpacity>
        </ScrollView>
      )}

      {step === 1 && (
        <ScrollView contentContainerStyle={styles.stepContent}>
          <Feather name="shield" size={60} color={COLORS.accent} style={styles.stepIcon} />
          <Text style={styles.title}>الصلاحيات</Text>
          <Text style={styles.subtitle}>امنح الحسن الصلاحيات اللازمة</Text>
          <Text style={styles.description}>
            يحتاج الحسن إلى بعض الصلاحيات لتنفيذ الأوامر بشكل كامل.
          </Text>

          {PERMISSIONS_TO_REQUEST.map((perm) => (
            <TouchableOpacity
              key={perm.id}
              style={[styles.permRow, granted[perm.id] && styles.permRowGranted]}
              onPress={() => requestPerm(perm.id)}
              activeOpacity={0.8}
            >
              <Feather
                name={granted[perm.id] ? "check-circle" : perm.icon}
                size={24}
                color={granted[perm.id] ? COLORS.success : COLORS.accent}
              />
              <View style={styles.permInfo}>
                <Text style={styles.permLabel}>{perm.label}</Text>
                <Text style={styles.permDesc}>{perm.desc}</Text>
              </View>
              {!granted[perm.id] && (
                <Text style={styles.permAction}>منح</Text>
              )}
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.primaryBtn} onPress={handleFinish} activeOpacity={0.8}>
            <Text style={styles.primaryBtnText}>ابدأ مع الحسن</Text>
            <Feather name="arrow-left" size={20} color={COLORS.primaryBg} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={handleFinish}>
            <Text style={styles.skipText}>تخطي</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBg,
  },
  stepContent: {
    padding: SPACING.xl,
    alignItems: "center",
  },
  logoContainer: {
    marginBottom: SPACING.xl,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  logoText: {
    fontSize: 52,
    color: COLORS.primaryBg,
    fontWeight: "bold" as const,
  },
  stepIcon: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: TYPOGRAPHY.xxxl,
    color: COLORS.textPrimary,
    fontWeight: "bold" as const,
    marginBottom: SPACING.sm,
    textAlign: "center",
  },
  subtitle: {
    fontSize: TYPOGRAPHY.lg,
    color: COLORS.accent,
    marginBottom: SPACING.md,
    textAlign: "center",
  },
  description: {
    fontSize: TYPOGRAPHY.md,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: TYPOGRAPHY.lineHeightLg,
    marginBottom: SPACING.xxl,
  },
  inputContainer: {
    width: "100%",
    marginBottom: SPACING.xxl,
  },
  label: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
    textAlign: "right",
  },
  input: {
    backgroundColor: COLORS.surfaceBg,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    fontSize: TYPOGRAPHY.lg,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    width: "100%",
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    width: "100%",
    marginBottom: SPACING.md,
  },
  primaryBtnText: {
    fontSize: TYPOGRAPHY.lg,
    color: COLORS.primaryBg,
    fontWeight: "bold" as const,
  },
  skipBtn: {
    paddingVertical: SPACING.sm,
  },
  skipText: {
    fontSize: TYPOGRAPHY.md,
    color: COLORS.textMuted,
  },
  permRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    width: "100%",
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  permRowGranted: {
    borderColor: COLORS.success,
    backgroundColor: "rgba(76,175,125,0.05)",
  },
  permInfo: {
    flex: 1,
  },
  permLabel: {
    fontSize: TYPOGRAPHY.md,
    color: COLORS.textPrimary,
    textAlign: "right",
  },
  permDesc: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textMuted,
    textAlign: "right",
  },
  permAction: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.accent,
    fontWeight: "600" as const,
  },
});
