import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { COLORS } from "../theme/colors";
import { SPACING, RADIUS } from "../theme/spacing";
import { TYPOGRAPHY } from "../theme/typography";

interface Props {
  visible: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmActionModal({ visible, message, onConfirm, onCancel }: Props) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.iconRow}>
            <Text style={styles.icon}>⚡</Text>
          </View>
          <Text style={styles.title}>تأكيد الإجراء</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.8}>
              <Text style={styles.cancelText}>إلغاء</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm} activeOpacity={0.8}>
              <Text style={styles.confirmText}>تأكيد</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
  },
  modal: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.xl,
    padding: SPACING.xxl,
    width: "100%",
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: "center",
  },
  iconRow: {
    marginBottom: SPACING.md,
  },
  icon: {
    fontSize: 36,
  },
  title: {
    fontSize: TYPOGRAPHY.xl,
    color: COLORS.accent,
    fontWeight: "bold" as const,
    marginBottom: SPACING.md,
    textAlign: "center",
  },
  message: {
    fontSize: TYPOGRAPHY.md,
    color: COLORS.textPrimary,
    textAlign: "center",
    lineHeight: TYPOGRAPHY.lineHeightLg,
    marginBottom: SPACING.xxl,
  },
  buttons: {
    flexDirection: "row",
    gap: SPACING.md,
    width: "100%",
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceBg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelText: {
    fontSize: TYPOGRAPHY.md,
    color: COLORS.textSecondary,
    fontWeight: "600" as const,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.accent,
    alignItems: "center",
  },
  confirmText: {
    fontSize: TYPOGRAPHY.md,
    color: COLORS.primaryBg,
    fontWeight: "bold" as const,
  },
});
