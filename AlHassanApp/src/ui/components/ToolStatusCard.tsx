import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../theme/colors";
import { SPACING, RADIUS } from "../theme/spacing";
import { TYPOGRAPHY } from "../theme/typography";
import type { ToolStatus } from "../../types/tool.types";

interface Props {
  name: string;
  description: string;
  status: ToolStatus;
}

function getStatusIcon(status: ToolStatus): { icon: keyof typeof Feather.glyphMap; color: string } {
  switch (status) {
    case "success":
      return { icon: "check-circle", color: COLORS.success };
    case "error":
      return { icon: "x-circle", color: COLORS.error };
    case "running":
      return { icon: "loader", color: COLORS.accent };
    case "permission_denied":
      return { icon: "lock", color: COLORS.warning };
    case "not_available":
      return { icon: "slash", color: COLORS.textMuted };
    default:
      return { icon: "circle", color: COLORS.textMuted };
  }
}

export function ToolStatusCard({ name, description, status }: Props) {
  const { icon, color } = getStatusIcon(status);

  return (
    <View style={styles.card}>
      <Feather name={icon} size={20} color={color} />
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.desc}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: TYPOGRAPHY.md,
    color: COLORS.textPrimary,
    fontWeight: "600" as const,
  },
  desc: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
