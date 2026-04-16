import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { ChatMessage } from "../../types/chat.types";
import { COLORS } from "../theme/colors";
import { SPACING, RADIUS } from "../theme/spacing";
import { TYPOGRAPHY } from "../theme/typography";
import { formatTime } from "../../utils/time";

interface Props {
  message: ChatMessage;
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";
  const isError = message.contentType === "error";
  const isConfirmation = message.contentType === "confirmation-request";

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
      {!isUser && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>ح</Text>
        </View>
      )}
      <View style={[
        styles.bubble,
        isUser ? styles.userBubble : styles.assistantBubble,
        isError && styles.errorBubble,
        isConfirmation && styles.confirmBubble,
      ]}>
        <Text style={[
          styles.messageText,
          isUser ? styles.userText : styles.assistantText,
          isError && styles.errorText,
        ]}>
          {message.content}
        </Text>
        <Text style={styles.timestamp}>{formatTime(message.timestamp)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    alignItems: "flex-end",
  },
  userContainer: {
    flexDirection: "row-reverse",
  },
  assistantContainer: {
    flexDirection: "row",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: SPACING.sm,
    marginBottom: 4,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "bold" as const,
    color: COLORS.primaryBg,
  },
  bubble: {
    maxWidth: "75%",
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  userBubble: {
    backgroundColor: COLORS.userBubble,
    borderColor: COLORS.userBubbleBorder,
    borderWidth: 1,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: COLORS.assistantBubble,
    borderColor: COLORS.assistantBubbleBorder,
    borderWidth: 1,
    borderBottomLeftRadius: 4,
  },
  errorBubble: {
    backgroundColor: "rgba(224,92,92,0.1)",
    borderColor: COLORS.error,
  },
  confirmBubble: {
    backgroundColor: "rgba(212,168,83,0.1)",
    borderColor: COLORS.accent,
  },
  messageText: {
    fontSize: TYPOGRAPHY.md,
    lineHeight: TYPOGRAPHY.lineHeightMd,
    writingDirection: "rtl",
  },
  userText: {
    color: COLORS.textPrimary,
    textAlign: "right",
  },
  assistantText: {
    color: COLORS.textPrimary,
    textAlign: "right",
  },
  errorText: {
    color: COLORS.error,
  },
  timestamp: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.xs / 2,
    textAlign: "right",
  },
});
