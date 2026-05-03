import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Clipboard, ToastAndroid, Platform, Animated } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { ChatMessage } from "../../types/chat.types";
import { COLORS } from "../theme/colors";
import { SPACING, RADIUS } from "../theme/spacing";
import { TYPOGRAPHY } from "../theme/typography";
import { formatTime } from "../../utils/time";

interface Props {
  message: ChatMessage;
}

const TOOL_LABELS: Record<string, { label: string; icon: keyof typeof Feather.glyphMap }> = {
  phone: { label: "اتصال", icon: "phone" },
  call: { label: "اتصال", icon: "phone" },
  send_message: { label: "رسالة", icon: "message-circle" },
  messaging: { label: "رسالة", icon: "message-circle" },
  sms: { label: "رسالة", icon: "message-circle" },
  camera: { label: "كاميرا", icon: "camera" },
  gallery: { label: "معرض الصور", icon: "image" },
  maps: { label: "خرائط", icon: "map-pin" },
  location: { label: "موقع", icon: "map-pin" },
  reminder: { label: "تذكير", icon: "bell" },
  calendar: { label: "تقويم", icon: "calendar" },
  "app-launcher": { label: "فتح تطبيق", icon: "external-link" },
  open_app: { label: "فتح تطبيق", icon: "external-link" },
  search: { label: "بحث", icon: "search" },
  web_search: { label: "بحث ويب", icon: "search" },
  browser: { label: "متصفح", icon: "globe" },
  memory: { label: "ذاكرة", icon: "database" },
  note: { label: "ملاحظة", icon: "file-text" },
  notes: { label: "ملاحظة", icon: "file-text" },
  share: { label: "مشاركة", icon: "share-2" },
};

function ToolBadge({ toolName, success }: { toolName: string; success: boolean }) {
  const info = TOOL_LABELS[toolName] ?? { label: toolName, icon: "tool" as keyof typeof Feather.glyphMap };
  const color = success ? COLORS.success : COLORS.error;
  const bg = success ? "rgba(76,175,125,0.1)" : "rgba(224,92,92,0.1)";

  return (
    <View style={[toolBadgeStyles.badge, { borderColor: color, backgroundColor: bg }]}>
      <Feather name={info.icon} size={11} color={color} />
      <Text style={[toolBadgeStyles.label, { color }]}>{info.label}</Text>
      <Feather name={success ? "check" : "x"} size={11} color={color} />
    </View>
  );
}

const toolBadgeStyles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 3,
    alignSelf: "flex-end",
    marginBottom: SPACING.xs,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
  },
});

function copyToClipboard(text: string) {
  Clipboard.setString(text);
  if (Platform.OS === "android") {
    ToastAndroid.show("تم النسخ ✓", ToastAndroid.SHORT);
  }
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";
  const isError = message.contentType === "error";
  const isConfirmation = message.contentType === "confirmation-request";
  const hasToolResult = !!message.toolResult;
  const [showCopy, setShowCopy] = useState(false);

  // Entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(isUser ? 16 : -16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.assistantContainer,
        { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
      ]}
    >
      {!isUser && (
        <View style={[styles.avatar, isError && styles.avatarError]}>
          <Text style={styles.avatarText}>ح</Text>
        </View>
      )}

      <View style={styles.bubbleCol}>
        {hasToolResult && (
          <ToolBadge
            toolName={message.toolResult!.toolName}
            success={message.toolResult!.success}
          />
        )}

        <Pressable
          onLongPress={() => {
            copyToClipboard(message.content);
            setShowCopy(true);
            setTimeout(() => setShowCopy(false), 2200);
          }}
          delayLongPress={380}
        >
          <View style={[
            styles.bubble,
            isUser ? styles.userBubble : styles.assistantBubble,
            isError && styles.errorBubble,
            isConfirmation && styles.confirmBubble,
            showCopy && styles.bubbleCopied,
          ]}>
            {isConfirmation && (
              <View style={styles.confirmHeader}>
                <Feather name="alert-circle" size={14} color={COLORS.accent} />
                <Text style={styles.confirmLabel}>تأكيد مطلوب</Text>
              </View>
            )}

            <Text
              selectable
              style={[
                styles.messageText,
                isUser ? styles.userText : styles.assistantText,
                isError && styles.errorText,
              ]}
            >
              {message.content}
            </Text>

            {hasToolResult && message.toolResult!.summary && (
              <Text style={styles.toolSummary}>{message.toolResult!.summary}</Text>
            )}

            <View style={styles.footer}>
              {showCopy && (
                <View style={styles.copiedBadge}>
                  <Feather name="copy" size={10} color={COLORS.success} />
                  <Text style={styles.copiedText}>تم النسخ</Text>
                </View>
              )}
              <Text style={styles.timestamp}>{formatTime(message.timestamp)}</Text>
              {isUser && (
                <Feather
                  name={message.status === "sending" ? "clock" : "check-circle"}
                  size={11}
                  color={message.status === "sending" ? COLORS.textMuted : COLORS.success}
                />
              )}
            </View>
          </View>
        </Pressable>
      </View>

      {isUser && <View style={styles.userSpacer} />}
    </Animated.View>
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
  userSpacer: {
    width: 6,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: SPACING.sm,
    marginBottom: 4,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 4,
  },
  avatarError: {
    backgroundColor: COLORS.error,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: "bold" as const,
    color: COLORS.primaryBg,
  },
  bubbleCol: {
    maxWidth: "80%",
    flexDirection: "column",
  },
  bubble: {
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 3,
  },
  userBubble: {
    backgroundColor: "#1C3A5E",
    borderColor: COLORS.userBubbleBorder,
    borderWidth: 1,
    borderBottomRightRadius: 6,
  },
  assistantBubble: {
    backgroundColor: COLORS.assistantBubble,
    borderColor: COLORS.assistantBubbleBorder,
    borderWidth: 1,
    borderBottomLeftRadius: 6,
  },
  errorBubble: {
    backgroundColor: "rgba(224,92,92,0.08)",
    borderColor: COLORS.error,
  },
  confirmBubble: {
    backgroundColor: "rgba(212,168,83,0.08)",
    borderColor: COLORS.accent,
  },
  confirmHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  confirmLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.accent,
    fontWeight: "700",
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
  toolSummary: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
    textAlign: "right",
    fontStyle: "italic",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    marginTop: SPACING.xs,
  },
  timestamp: {
    fontSize: TYPOGRAPHY.xs - 1,
    color: COLORS.textMuted,
  },
  bubbleCopied: {
    borderColor: COLORS.success,
    borderWidth: 1.5,
  },
  copiedBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 3,
    marginRight: SPACING.xs,
  },
  copiedText: {
    fontSize: 10,
    color: COLORS.success,
    fontWeight: "600" as const,
  },
});
