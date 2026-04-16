import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../theme/colors";
import { SPACING, RADIUS } from "../theme/spacing";
import { TYPOGRAPHY } from "../theme/typography";

interface Props {
  message: string;
  onRequest: () => void;
}

export function PermissionBanner({ message, onRequest }: Props) {
  return (
    <View style={styles.banner}>
      <Feather name="alert-circle" size={18} color={COLORS.warning} />
      <Text style={styles.text}>{message}</Text>
      <TouchableOpacity style={styles.btn} onPress={onRequest} activeOpacity={0.8}>
        <Text style={styles.btnText}>منح</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: "rgba(245,166,35,0.1)",
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.warning,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
  },
  text: {
    flex: 1,
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
  },
  btn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.warning,
    borderRadius: RADIUS.sm,
  },
  btnText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.primaryBg,
    fontWeight: "bold" as const,
  },
});
