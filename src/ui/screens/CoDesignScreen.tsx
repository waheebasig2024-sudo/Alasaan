import React from "react";
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { COLORS } from "../theme/colors";
import { SPACING, RADIUS } from "../theme/spacing";
import { TYPOGRAPHY } from "../theme/typography";

const FEATURES = [
  "توليد واجهات وملفات تصميم محلية",
  "معاينة التصميمات كشبكات وSnapshots",
  "حفظ الإصدارات والرجوع لها",
  "دعم عدة نماذج ذكاء اصطناعي",
  "تصدير HTML / PDF / PPTX / ZIP",
];

export function CoDesignScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + SPACING.lg, paddingBottom: insets.bottom + SPACING.xl }}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-right" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Open CoDesign</Text>
          <Text style={styles.subtitle}>ميزة مساعدة داخل الحسن لتوليد الواجهات والمراجع</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>ماذا يفعل؟</Text>
        {FEATURES.map((item) => (
          <View key={item} style={styles.row}>
            <Feather name="check-circle" size={14} color={COLORS.success} />
            <Text style={styles.rowText}>{item}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>كيف تستفيد منه داخل الحسن؟</Text>
        <Text style={styles.paragraph}>اكتب للحسن طلب تصميم، وهو سيحوّله إلى واجهة أو كود قابل للمعاينة بدل فتح المشروع الخارجي كبرنامج منفصل.</Text>
        <Text style={styles.paragraph}>هذا يحافظ على الحسن كتطبيق Android واحد، ويستفيد من أفكار المشروع الآخر بأمان ودقة.</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8} onPress={() => Linking.openURL("https://github.com/OpenCoworkAI/open-codesign")}>
          <Feather name="external-link" size={16} color={COLORS.primaryBg} />
          <Text style={styles.primaryBtnText}>فتح المشروع الأصلي</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primaryBg },
  header: { flexDirection: "row-reverse", alignItems: "center", gap: SPACING.md, paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.cardBg },
  title: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.xl, fontWeight: "700" as const, textAlign: "right" },
  subtitle: { color: COLORS.textMuted, fontSize: TYPOGRAPHY.sm, textAlign: "right", marginTop: 2 },
  card: { marginHorizontal: SPACING.lg, marginBottom: SPACING.md, backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, gap: SPACING.sm },
  cardTitle: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.md, fontWeight: "700" as const, textAlign: "right" },
  row: { flexDirection: "row-reverse", alignItems: "center", gap: SPACING.xs },
  rowText: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.sm, textAlign: "right", flex: 1 },
  paragraph: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.sm, textAlign: "right", lineHeight: 22 },
  actions: { paddingHorizontal: SPACING.lg, marginTop: SPACING.sm },
  primaryBtn: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: SPACING.sm, backgroundColor: COLORS.accent, borderRadius: RADIUS.md, paddingVertical: SPACING.md },
  primaryBtnText: { color: COLORS.primaryBg, fontSize: TYPOGRAPHY.md, fontWeight: "700" as const },
});