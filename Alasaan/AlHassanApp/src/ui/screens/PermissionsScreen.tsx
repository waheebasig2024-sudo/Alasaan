import React from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { PermissionBanner } from "../components/PermissionBanner";
import { COLORS } from "../theme/colors";
import { SPACING } from "../theme/spacing";
import {
  PERMISSION_DESCRIPTIONS,
  PERMISSION_LABELS,
  type PermissionType,
} from "../../constants/permissions";
import { useToolPermissions } from "../../hooks/useToolPermissions";

export function PermissionsScreen() {
  const { requested, ensurePermission } = useToolPermissions();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>صلاحيات الحسن</Text>
      <Text style={styles.subtitle}>
        يطلب الحسن الصلاحيات عند الحاجة لتنفيذ أمر حقيقي، ولا ينفذ إجراءً حساسًا دون تأكيدك.
      </Text>

      {Object.entries(PERMISSION_LABELS).map(([permission, label]) => {
        const permissionType = permission as PermissionType;
        const requestedBefore = requested.has(permissionType);
        return (
          <PermissionBanner
            key={permission}
            message={`${label}: ${
              requestedBefore ? "تم طلب الصلاحية" : PERMISSION_DESCRIPTIONS[permissionType]
            }`}
            onRequest={() => {
              void ensurePermission(permissionType);
            }}
          />
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
    gap: SPACING.md,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    textAlign: "right",
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 24,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
  },
});