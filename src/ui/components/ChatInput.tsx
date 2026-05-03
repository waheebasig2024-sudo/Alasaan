import React, { useState, useRef, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Animated,
  Text,
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
  isRecording?: boolean;
  isTranscribing?: boolean;
  isWakeWordActive?: boolean;
  isContinuousMode?: boolean;
  onVoiceStart?: () => void;
  onVoiceStop?: () => void;
  onWakeWordToggle?: () => void;
  onContinuousModeToggle?: () => void;
}

export function ChatInput({
  onSend,
  isLoading,
  isRecording = false,
  isTranscribing = false,
  isWakeWordActive = false,
  isContinuousMode = false,
  onVoiceStart,
  onVoiceStop,
  onWakeWordToggle,
  onContinuousModeToggle,
}: Props) {
  const [text, setText] = useState("");
  const inputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();
  const micScale = useRef(new Animated.Value(1)).current;
  const micPulse = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef<Animated.CompositeAnimation | null>(null);

  // Idle pulse animation on mic button
  useEffect(() => {
    if (!isRecording && !isLoading && !isContinuousMode && !isTranscribing) {
      pulseAnim.current = Animated.loop(
        Animated.sequence([
          Animated.timing(micPulse, { toValue: 1.08, duration: 1000, useNativeDriver: true }),
          Animated.timing(micPulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      );
      pulseAnim.current.start();
    } else {
      pulseAnim.current?.stop();
      micPulse.setValue(1);
    }
    return () => {
      pulseAnim.current?.stop();
    };
  }, [isRecording, isLoading, isContinuousMode, isTranscribing, micPulse]);

  const handleSend = async () => {
    if (!text.trim() || isLoading) return;
    const msg = text.trim();
    setText("");
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSend(msg);
  };

  const handleVoicePress = async () => {
    if (isTranscribing) return;
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Animated.sequence([
      Animated.timing(micScale, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.timing(micScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    if (isRecording) onVoiceStop?.();
    else onVoiceStart?.();
  };

  const canSend = text.trim().length > 0 && !isLoading && !isRecording;

  const paddingBottom =
    Platform.OS === "web" ? 16 : Math.max(insets.bottom, SPACING.sm);

  let statusLabel = "";
  let statusColor: string = COLORS.success;
  if (isContinuousMode) {
    statusLabel = isRecording ? "🎙 أتحدث..." : isLoading ? "⏳ يعالج..." : "👂 استمع — تحدث الآن";
    statusColor = isRecording ? COLORS.error : isLoading ? COLORS.accent : COLORS.success;
  } else if (isWakeWordActive) {
    statusLabel = 'أنا أستمع... قل "يا الحسن"';
    statusColor = COLORS.success;
  }

  return (
    <View style={[styles.container, { paddingBottom }]}>

      {/* ── Status bar ── */}
      {(isWakeWordActive || isContinuousMode) && (
        <View style={[styles.statusBar, { borderColor: statusColor + "30" }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      )}

      {/* ── Input row ── */}
      <View style={styles.row}>

        {/* Send button */}
        <TouchableOpacity
          style={[styles.roundBtn, canSend ? styles.roundBtnActive : styles.roundBtnMuted]}
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

        {/* Text input */}
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            isRecording && styles.inputRecording,
            isContinuousMode && styles.inputContinuous,
            canSend && styles.inputActive,
          ]}
          value={text}
          onChangeText={setText}
          placeholder={
            isRecording
              ? "أستمع لك..."
              : isTranscribing
              ? "جاري فهم كلامك..."
              : isContinuousMode
              ? "وضع المحادثة المستمرة"
              : "اكتب رسالتك..."
          }
          placeholderTextColor={COLORS.textMuted}
          multiline
          maxLength={1000}
          textAlign="right"
          textAlignVertical="center"
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
          editable={!isRecording && !isTranscribing}
        />

        {/* Mic button with pulse */}
        {(onVoiceStart || onVoiceStop) && (
          <Animated.View style={{ transform: [{ scale: micScale }] }}>
            <Animated.View
              style={[
                styles.micPulseRing,
                { transform: [{ scale: micPulse }], opacity: isRecording ? 0 : 0.5 },
              ]}
            />
            <TouchableOpacity
              style={[
                styles.roundBtn,
                isRecording ? styles.roundBtnRecording : styles.roundBtnMic,
              ]}
              onPress={handleVoicePress}
              activeOpacity={0.8}
              disabled={isTranscribing}
            >
              {isTranscribing ? (
                <ActivityIndicator size="small" color={COLORS.primaryBg} />
              ) : (
                <Feather
                  name={isRecording ? "square" : "mic"}
                  size={SIZES.iconMd}
                  color={COLORS.primaryBg}
                />
              )}
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {/* ── Bottom row ── */}
      <View style={styles.hintRow}>
        {onContinuousModeToggle && (
          <TouchableOpacity
            onPress={onContinuousModeToggle}
            style={[styles.modeBtn, isContinuousMode && styles.modeBtnActive]}
            activeOpacity={0.75}
            accessibilityLabel="وضع مستمر"
          >
            <Feather
              name="headphones"
              size={12}
              color={isContinuousMode ? COLORS.primaryBg : COLORS.textMuted}
            />
          </TouchableOpacity>
        )}

        {onWakeWordToggle && !isContinuousMode && (
          <TouchableOpacity
            onPress={onWakeWordToggle}
            style={[styles.modeBtn, isWakeWordActive && styles.modeBtnWake]}
            activeOpacity={0.75}
            accessibilityLabel="تفعيل الكلمة المنبّهة"
          >
            <Feather
              name="radio"
              size={12}
              color={isWakeWordActive ? COLORS.primaryBg : COLORS.textMuted}
            />
          </TouchableOpacity>
        )}

        <Text style={styles.hintText} numberOfLines={1}>
          {isContinuousMode
            ? "وضع مستمر — تحدث بحرية بعد كل رد"
            : isWakeWordActive
            ? 'أستمع لكلمة "يا الحسن"'
            : isRecording
            ? "اضغط ■ للإيقاف"
            : "اضغط 🎙 وتحدث — أو اكتب"}
        </Text>
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
    gap: SPACING.xs,
  },
  statusBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    paddingBottom: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.full,
  },
  statusText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: SPACING.sm,
  },
  roundBtn: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  roundBtnActive: {
    backgroundColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 5,
  },
  roundBtnMuted: {
    backgroundColor: COLORS.surfaceBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  roundBtnMic: {
    backgroundColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  roundBtnRecording: {
    backgroundColor: COLORS.error,
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  micPulseRing: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.accent,
    zIndex: -1,
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
  inputActive: {
    borderColor: COLORS.accentDark,
  },
  inputRecording: {
    borderColor: COLORS.error,
    color: COLORS.textMuted,
  },
  inputContinuous: {
    borderColor: COLORS.success,
    borderWidth: 1.5,
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  modeBtn: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  modeBtnActive: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  modeBtnWake: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  hintText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
    flex: 1,
    textAlign: "center",
  },
});
