import React, { useCallback, useRef, useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Platform,
  StatusBar,
  Alert,
  Text,
  TouchableOpacity,
  Animated,
} from "react-native";
import { KeyboardAvoidingView } from "react-native";
import { router } from "expo-router";
import * as Speech from "expo-speech";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { MessageList } from "../components/MessageList";
import { ChatInput } from "../components/ChatInput";
import { QuickActions } from "../components/QuickActions";
import { ConfirmActionModal } from "../components/ConfirmActionModal";
import { useChatSession } from "../../hooks/useChatSession";
import { useVoiceInput } from "../../hooks/useVoiceInput";
import { useWakeWord } from "../../hooks/useWakeWord";
import { useAssistant } from "../../providers/AssistantProvider";
import { useChatStore, makeAssistantMessage } from "../../store/chat.store";
import { COLORS } from "../theme/colors";
import { SPACING, RADIUS, SIZES } from "../theme/spacing";
import { TYPOGRAPHY } from "../theme/typography";

function LargeMicDisplay({
  isTranscribing,
  isContinuousMode,
  onStop,
}: {
  isTranscribing: boolean;
  isContinuousMode: boolean;
  onStop: () => void;
}) {
  const ring1 = useRef(new Animated.Value(1)).current;
  const ring2 = useRef(new Animated.Value(1)).current;
  const ring3 = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animate = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1.6, duration: 900, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      );

    const a1 = animate(ring1, 0);
    const a2 = animate(ring2, 300);
    const a3 = animate(ring3, 600);
    a1.start();
    a2.start();
    a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, [ring1, ring2, ring3]);

  return (
    <View style={largeMicStyles.container}>
      <TouchableOpacity onPress={isContinuousMode ? undefined : onStop} activeOpacity={isContinuousMode ? 1 : 0.85}>
        <View style={largeMicStyles.wrapper}>
          <Animated.View style={[largeMicStyles.ring, largeMicStyles.ring3, { transform: [{ scale: ring3 }] }]} />
          <Animated.View style={[largeMicStyles.ring, largeMicStyles.ring2, { transform: [{ scale: ring2 }] }]} />
          <Animated.View style={[largeMicStyles.ring, largeMicStyles.ring1, { transform: [{ scale: ring1 }] }]} />
          <View style={[largeMicStyles.btn, isContinuousMode && largeMicStyles.btnContinuous]}>
            <Feather name="mic" size={44} color={COLORS.primaryBg} />
          </View>
        </View>
      </TouchableOpacity>
      <Text style={largeMicStyles.hint}>
        {isTranscribing
          ? "جاري فهم كلامك..."
          : isContinuousMode
          ? "تحدث الآن — أستمع لك"
          : "تحدث الآن — اضغط للإيقاف"}
      </Text>
      {!isContinuousMode && (
        <TouchableOpacity onPress={onStop} style={largeMicStyles.stopBtn}>
          <Feather name="square" size={18} color={COLORS.primaryBg} />
          <Text style={largeMicStyles.stopText}>إيقاف</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const largeMicStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xxl,
  },
  wrapper: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    borderRadius: RADIUS.full,
  },
  ring1: { width: 140, height: 140, backgroundColor: COLORS.accentGlow },
  ring2: { width: 120, height: 120, backgroundColor: "rgba(212,168,83,0.2)" },
  ring3: { width: 100, height: 100, backgroundColor: "rgba(212,168,83,0.12)" },
  btn: {
    width: 88,
    height: 88,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  btnContinuous: {
    backgroundColor: COLORS.success,
    shadowColor: COLORS.success,
  },
  hint: {
    marginTop: SPACING.lg,
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textMuted,
    textAlign: "center",
  },
  stopBtn: {
    marginTop: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  stopText: {
    color: COLORS.primaryBg,
    fontSize: TYPOGRAPHY.sm,
    fontWeight: "600",
  },
});

export function ChatScreen() {
  const { messages, isLoading, pendingConfirmation, sendMessage, confirmAction } = useChatSession();
  const { clearChat, isSpeakingState } = useAssistant();
  const insets = useSafeAreaInsets();

  // ── Continuous mode state ──────────────────────────────────────────
  // When ON: mic auto-restarts after every response — no wake word needed
  const [continuousMode, setContinuousMode] = useState(false);
  const continuousModeRef = useRef(false);
  const prevSpeakingRef = useRef(false);

  const { isListening, isTranscribing, startListening, stopListening } = useVoiceInput({
    onTranscript: (text) => {
      if (text.trim()) sendMessage(text.trim());
    },
  });

  // Auto-restart mic after speaking finishes in continuous mode
  useEffect(() => {
    const wasSpaking = prevSpeakingRef.current;
    prevSpeakingRef.current = isSpeakingState;

    if (wasSpaking && !isSpeakingState && continuousModeRef.current && !isLoading && !isListening) {
      // Small delay to let audio session release
      setTimeout(() => {
        if (continuousModeRef.current) {
          startListening();
        }
      }, 600);
    }
  }, [isSpeakingState, isLoading, isListening, startListening]);

  const handleContinuousModeToggle = useCallback(async () => {
    const next = !continuousMode;
    setContinuousMode(next);
    continuousModeRef.current = next;

    if (next) {
      // Start immediately
      if (isWatching) await stopWatchingRef.current?.();
      if (!isListening) {
        setTimeout(() => startListening(), 300);
      }
    } else {
      // Stop listening when exiting continuous mode
      if (isListening) await stopListening();
    }
  }, [continuousMode, isListening, startListening, stopListening]);

  // ── Wake word ──────────────────────────────────────────────────────
  const stopWatchingRef = useRef<(() => Promise<void>) | null>(null);

  const { isWatching, startWatching, stopWatching } = useWakeWord({
    onActivated: useCallback(
      (_partial?: string) => {
        if (continuousModeRef.current) return; // continuous mode handles this
        const greeting = "تفضل، وش أسوي لك؟";
        if (Platform.OS !== "web") {
          Speech.speak(greeting, { language: "ar-YE", pitch: 0.9, rate: 0.88 });
        }
        useChatStore.getState().addMessage(makeAssistantMessage(greeting));
        setTimeout(() => { startListening(); }, 2200);
      },
      [startListening]
    ),
    onError: useCallback((_err: string) => {}, []),
  });

  stopWatchingRef.current = stopWatching;

  const handleVoiceStart = useCallback(async () => {
    if (isWatching) {
      await stopWatchingRef.current?.();
      await new Promise<void>((r) => setTimeout(r, 500));
    }
    await startListening();
  }, [isWatching, startListening]);

  const handleVoiceStop = useCallback(async () => {
    await stopListening();
  }, [stopListening]);

  const handleWakeWordToggle = useCallback(async () => {
    if (continuousMode) return; // don't allow wake word in continuous mode
    if (isWatching) {
      await stopWatching();
    } else {
      if (isListening) await stopListening();
      await startWatching();
    }
  }, [isWatching, isListening, startWatching, stopWatching, stopListening, continuousMode]);

  const handleClearChat = useCallback(() => {
    Alert.alert("مسح المحادثة", "هل تريد مسح المحادثة الحالية؟", [
      { text: "إلغاء", style: "cancel" },
      { text: "مسح", style: "destructive", onPress: () => clearChat() },
    ]);
  }, [clearChat]);

  const showQuickActions = messages.length <= 1 && !isListening;

  // Status subtitle
  const subtitle = isLoading
    ? "يفكر..."
    : isSpeakingState
    ? "يتحدث..."
    : isListening
    ? "يستمع..."
    : continuousMode
    ? "وضع مستمر 🟢"
    : "مساعدك الذكي";

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 0 : insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.secondaryBg} />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        {/* Left */}
        <View style={styles.headerSide}>
          <TouchableOpacity style={styles.headerIconBtn} onPress={handleClearChat} activeOpacity={0.7}>
            <Feather name="trash-2" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.push("/memory")} activeOpacity={0.7}>
            <Feather name="database" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Center */}
        <View style={styles.headerCenter}>
          <View style={[styles.headerAvatar, continuousMode && styles.headerAvatarActive]}>
            <Text style={styles.headerAvatarText}>ح</Text>
          </View>
          <View style={styles.headerTitleGroup}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>الحسن</Text>
              <Text style={styles.headerFullName}>المساعد الشخصي الذكي</Text>
              {(isSpeakingState || isLoading) && <View style={styles.speakingDot} />}
              {continuousMode && <View style={styles.continuousDot} />}
            </View>
            <Text style={styles.headerSubtitle} numberOfLines={1}>{subtitle}</Text>
          </View>
        </View>

        {/* Right */}
        <View style={styles.headerSide}>
          {/* Continuous mode toggle — ear icon */}
          <TouchableOpacity
            style={[styles.headerIconBtn, continuousMode && styles.headerIconBtnActive]}
            onPress={handleContinuousModeToggle}
            activeOpacity={0.7}
            accessibilityLabel="وضع المحادثة المستمرة"
          >
            <Feather name="headphones" size={20} color={continuousMode ? COLORS.success : COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.push("/offline-ai")} activeOpacity={0.7}>
            <Feather name="cpu" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.push("/settings")} activeOpacity={0.7}>
            <Feather name="settings" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Body ─── */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 8 : 0}
      >
        <View style={styles.flex}>
          {isListening && (
            <LargeMicDisplay
              isTranscribing={isTranscribing}
              isContinuousMode={continuousMode}
              onStop={handleVoiceStop}
            />
          )}

          <MessageList messages={[...messages].reverse()} isLoading={isLoading} />

          {showQuickActions && !continuousMode && <QuickActions onAction={sendMessage} />}

          <ChatInput
            onSend={sendMessage}
            isLoading={isLoading}
            isRecording={isListening}
            isTranscribing={isTranscribing}
            isWakeWordActive={isWatching}
            isContinuousMode={continuousMode}
            onVoiceStart={Platform.OS !== "web" ? handleVoiceStart : undefined}
            onVoiceStop={Platform.OS !== "web" ? handleVoiceStop : undefined}
            onWakeWordToggle={Platform.OS !== "web" ? handleWakeWordToggle : undefined}
            onContinuousModeToggle={Platform.OS !== "web" ? handleContinuousModeToggle : undefined}
          />
        </View>
      </KeyboardAvoidingView>

      <ConfirmActionModal
        visible={!!pendingConfirmation}
        message={pendingConfirmation?.message ?? ""}
        onConfirm={() => confirmAction(true)}
        onCancel={() => confirmAction(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primaryBg },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.secondaryBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
    height: SIZES.headerHeight + 4,
  },
  headerSide: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    minWidth: 80,
  },
  headerIconBtn: {
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  headerIconBtnActive: {
    backgroundColor: "rgba(74,222,128,0.1)",
    borderRadius: RADIUS.md,
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  headerAvatarActive: {
    backgroundColor: COLORS.success,
    shadowColor: COLORS.success,
  },
  headerAvatarText: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.primaryBg,
  },
  headerTitleGroup: { alignItems: "center" },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: "700",
    color: COLORS.accent,
    fontFamily: "Inter_700Bold",
  },
  headerFullName: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontWeight: "500",
  },
  speakingDot: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.error,
  },
  continuousDot: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.success,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
    marginTop: 1,
  },
});
