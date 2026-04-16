import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Switch,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useSettings } from "../../providers/SettingsProvider";
import { useAssistant } from "../../providers/AssistantProvider";
import { useMemoryStore } from "../../store/memory.store";
import { storageRemove } from "../../services/storage.service";
import { STORAGE_KEYS } from "../../constants/storage-keys";
import { COLORS } from "../theme/colors";
import { SPACING, RADIUS } from "../theme/spacing";
import { TYPOGRAPHY } from "../theme/typography";

interface SettingRowProps {
  label: string;
  description?: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}

function SettingRow({ label, description, value, onToggle }: SettingRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.rowInfo}>
        <Text style={styles.rowLabel}>{label}</Text>
        {description && <Text style={styles.rowDesc}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: COLORS.border, true: COLORS.accent }}
        thumbColor={value ? COLORS.primaryBg : COLORS.textMuted}
      />
    </View>
  );
}

interface ActionRowProps {
  label: string;
  description?: string;
  icon: keyof typeof Feather.glyphMap;
  color?: string;
  onPress: () => void;
}

function ActionRow({ label, description, icon, color, onPress }: ActionRowProps) {
  return (
    <TouchableOpacity style={styles.actionRow} onPress={onPress} activeOpacity={0.7}>
      <Feather name={icon} size={20} color={color ?? COLORS.textSecondary} />
      <View style={styles.rowInfo}>
        <Text style={[styles.rowLabel, color ? { color } : undefined]}>{label}</Text>
        {description && <Text style={styles.rowDesc}>{description}</Text>}
      </View>
      <Feather name="chevron-left" size={16} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

export function SettingsScreen() {
  const { settings, updateSettings, isLoaded } = useSettings();
  const { clearChat } = useAssistant();
  const { loadAll } = useMemoryStore();
  const insets = useSafeAreaInsets();
  const [clearing, setClearing] = useState(false);

  const handleClearChat = () => {
    Alert.alert("مسح المحادثة", "هل تريد مسح تاريخ المحادثة الحالي؟", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "مسح",
        style: "destructive",
        onPress: () => clearChat(),
      },
    ]);
  };

  const handleClearMemory = () => {
    Alert.alert("مسح الذاكرة", "سيتم حذف جميع المعلومات المحفوظة. هل أنت متأكد؟", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "حذف",
        style: "destructive",
        onPress: async () => {
          setClearing(true);
          try {
            await storageRemove(STORAGE_KEYS.MEMORY_ENTRIES);
            await storageRemove(STORAGE_KEYS.NOTES);
            await loadAll();
            Alert.alert("تم", "تم مسح الذاكرة بنجاح");
          } finally {
            setClearing(false);
          }
        },
      },
    ]);
  };

  const handleResetAll = () => {
    Alert.alert(
      "إعادة ضبط المصنع",
      "سيتم حذف جميع البيانات والإعدادات. هذا الإجراء لا يمكن التراجع عنه.",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "إعادة الضبط",
          style: "destructive",
          onPress: async () => {
            setClearing(true);
            try {
              await Promise.all(
                Object.values(STORAGE_KEYS).map((k) => storageRemove(k))
              );
              await updateSettings({ onboardingComplete: false });
            } finally {
              setClearing(false);
            }
          },
        },
      ]
    );
  };

  if (!isLoaded || clearing) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={COLORS.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + SPACING.xl },
      ]}
    >
      {/* المساعد */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>المساعد</Text>
        <SettingRow
          label="المساعد الصوتي"
          description="قراءة الردود بصوت عالٍ"
          value={settings.voiceEnabled}
          onToggle={(v) => updateSettings({ voiceEnabled: v })}
        />
        <SettingRow
          label="الاهتزاز اللمسي"
          description="اهتزاز عند الإرسال والتأكيد"
          value={settings.hapticFeedback}
          onToggle={(v) => updateSettings({ hapticFeedback: v })}
        />
      </View>

      {/* الأمان والخصوصية */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>الأمان والخصوصية</Text>
        <SettingRow
          label="وضع الأمان"
          description="تقييد الأوامر الحساسة تلقائياً"
          value={settings.safeMode}
          onToggle={(v) => updateSettings({ safeMode: v })}
        />
        <SettingRow
          label="تأكيد مكالمات الهاتف"
          description="اطلب تأكيداً قبل الاتصال"
          value={settings.requireConfirmationForCalls}
          onToggle={(v) => updateSettings({ requireConfirmationForCalls: v })}
        />
        <SettingRow
          label="تأكيد إرسال الرسائل"
          description="اطلب تأكيداً قبل الإرسال"
          value={settings.requireConfirmationForMessages}
          onToggle={(v) => updateSettings({ requireConfirmationForMessages: v })}
        />
        <SettingRow
          label="تأكيد الحذف"
          description="اطلب تأكيداً قبل حذف أي شيء"
          value={settings.requireConfirmationForDelete}
          onToggle={(v) => updateSettings({ requireConfirmationForDelete: v })}
        />
      </View>

      {/* نموذج الذكاء الاصطناعي */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>الذكاء الاصطناعي</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>نموذج Gemini</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{settings.geminiModel}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>سجل المحادثة</Text>
            <Text style={styles.infoValue}>آخر {settings.maxConversationHistory} رسالة</Text>
          </View>
        </View>
      </View>

      {/* إدارة البيانات */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>إدارة البيانات</Text>
        <ActionRow
          label="مسح المحادثة الحالية"
          description="حذف تاريخ الرسائل"
          icon="message-square"
          onPress={handleClearChat}
        />
        <ActionRow
          label="مسح الذاكرة"
          description="حذف المعلومات والملاحظات المحفوظة"
          icon="database"
          onPress={handleClearMemory}
        />
        <ActionRow
          label="إعادة ضبط المصنع"
          description="حذف جميع البيانات والإعدادات"
          icon="alert-triangle"
          color={COLORS.error}
          onPress={handleResetAll}
        />
      </View>

      {/* معلومات التطبيق */}
      <View style={styles.aboutCard}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>ح</Text>
        </View>
        <Text style={styles.appName}>الحسن</Text>
        <Text style={styles.appVersion}>الإصدار 1.0.0</Text>
        <Text style={styles.appDesc}>مساعد ذكي، Android SDK 28+</Text>
        <Text style={styles.appModel}>Powered by Gemini {settings.geminiModel}</Text>
      </View>
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
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primaryBg,
  },
  section: {
    marginBottom: SPACING.xxl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.accent,
    fontWeight: "700" as const,
    marginBottom: SPACING.sm,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    textAlign: "right",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rowInfo: {
    flex: 1,
    paddingRight: SPACING.sm,
  },
  rowLabel: {
    fontSize: TYPOGRAPHY.md,
    color: COLORS.textPrimary,
    textAlign: "right",
  },
  rowDesc: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textMuted,
    marginTop: 2,
    textAlign: "right",
  },
  infoCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.md,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.md,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textMuted,
  },
  badge: {
    backgroundColor: COLORS.accentGlow,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  badgeText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.accent,
    fontWeight: "600" as const,
  },
  aboutCard: {
    alignItems: "center",
    paddingVertical: SPACING.xxl,
    gap: SPACING.xs,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 32,
    color: COLORS.primaryBg,
    fontWeight: "bold" as const,
  },
  appName: {
    fontSize: TYPOGRAPHY.xl,
    color: COLORS.textPrimary,
    fontWeight: "bold" as const,
  },
  appVersion: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textMuted,
  },
  appDesc: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textMuted,
  },
  appModel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.accent,
    marginTop: SPACING.xs,
  },
});
