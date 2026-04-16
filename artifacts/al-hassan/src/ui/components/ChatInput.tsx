import React, { useState, useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../theme/colors";
import { SPACING, RADIUS, SIZES } from "../theme/spacing";
import { TYPOGRAPHY } from "../theme/typography";

interface Props {
  onSend: (text: string) => void;
  isLoading: boolean;
  onVoicePress?: () => void;
}

export function ChatInput({ onSend, isLoading, onVoicePress }: Props) {
  const [text, setText] = useState("");
  const inputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();

  const handleSend = async () => {
    if (!text.trim() || isLoading) return;
    const msg = text.trim();
    setText("");
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSend(msg);
  };

  const canSend = text.trim().length > 0 && !isLoading;

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom:
            Platform.OS === "web" ? 34 : Math.max(insets.bottom, SPACING.md),
        },
      ]}
    >
      <View style={styles.inputRow}>
        {onVoicePress && (
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onVoicePress}
            activeOpacity={0.7}
          >
            <Feather name="mic" size={SIZES.iconMd} color={COLORS.accent} />
          </TouchableOpacity>
        )}
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="اكتب رسالتك أو أمرك..."
          placeholderTextColor={COLORS.textMuted}
          multiline
          maxLength={1000}
          textAlign="right"
          textAlignVertical="center"
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[styles.sendBtn, canSend && styles.sendBtnActive]}
          onPress={handleSend}
          disabled={!canSend}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color={COLORS.primaryBg} size="small" />
          ) : (
            <Feather
              name="send"
              size={SIZES.iconMd}
              color={canSend ? COLORS.primaryBg : COLORS.textMuted}
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.secondaryBg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: SPACING.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceBg,
  },
  input: {
    flex: 1,
    minHeight: SIZES.inputHeight,
    maxHeight: 120,
    backgroundColor: COLORS.surfaceBg,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.md,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    writingDirection: "rtl",
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceBg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendBtnActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
});
