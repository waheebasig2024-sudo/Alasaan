// ============================================================
// Floating Command Bubble — فقاعة الأوامر العائمة
// تظهر فوق جميع الشاشات · أوامر صوتية سريعة لـ Aiden
// ============================================================

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  PanResponder,
  Platform,
  ActivityIndicator,
  Dimensions,
  Modal,
  KeyboardAvoidingView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "../theme/colors";
import { SPACING, RADIUS } from "../theme/spacing";
import { STORAGE_KEYS } from "../../constants/storage-keys";
import { AIDEN_DEFAULT_URL } from "../../config/aiden.config";
import { sendMessageToAiden } from "../../services/aiden.service";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const BUBBLE_SIZE = 56;
const BUBBLE_MARGIN = 16;

// ── Mini chat panel ──────────────────────────────────────────

interface QuickChatPanelProps {
  serverUrl: string;
  onClose: () => void;
}

function QuickChatPanel({ serverUrl, onClose }: QuickChatPanelProps) {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (sending) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.4, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [sending, pulseAnim]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || sending) return;
    const msg = input.trim();
    setInput("");
    setSending(true);
    setResponse("");
    setDone(false);

    await sendMessageToAiden(
      serverUrl,
      { message: msg, session: "bubble-quick" },
      (token) => setResponse((prev) => prev + token),
      undefined,
      () => { setSending(false); setDone(true); },
      (err) => { setResponse(`خطأ: ${err}`); setSending(false); setDone(true); }
    );
  }, [input, sending, serverUrl]);

  const QUICK_COMMANDS = ["ما الوقت؟", "افحص الشبكة", "حالة السيرفر", "اعرض المهام"];

  return (
    <View style={qcStyles.container}>
      {/* Header */}
      <LinearGradient colors={["#1A2236", "#0F1829"]} style={qcStyles.header}>
        <View style={qcStyles.headerLeft}>
          <View style={qcStyles.aidenDot} />
          <Text style={qcStyles.headerTitle}>Aiden</Text>
          <Text style={qcStyles.headerSub}>Quick Command</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={qcStyles.closeBtn} activeOpacity={0.7}>
          <Feather name="x" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      </LinearGradient>

      {/* Quick chips */}
      <View style={qcStyles.chipsRow}>
        {QUICK_COMMANDS.map((cmd) => (
          <TouchableOpacity
            key={cmd}
            style={qcStyles.chip}
            onPress={() => setInput(cmd)}
            activeOpacity={0.7}
          >
            <Text style={qcStyles.chipText}>{cmd}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Response area */}
      {(response || sending) ? (
        <View style={qcStyles.responseArea}>
          {sending && !response && (
            <View style={qcStyles.thinkingRow}>
              <Animated.View style={[qcStyles.thinkDot, { opacity: pulseAnim, backgroundColor: COLORS.accent }]} />
              <Text style={qcStyles.thinkText}>Aiden يفكر...</Text>
            </View>
          )}
          {response ? (
            <Text style={qcStyles.responseText}>{response}{!done ? "▌" : ""}</Text>
          ) : null}
        </View>
      ) : (
        <View style={qcStyles.emptyHint}>
          <Feather name="zap" size={16} color={COLORS.textMuted} />
          <Text style={qcStyles.hintText}>أرسل أمراً سريعاً لـ Aiden</Text>
        </View>
      )}

      {/* Input */}
      <View style={qcStyles.inputRow}>
        <TextInput
          style={qcStyles.input}
          value={input}
          onChangeText={setInput}
          placeholder="اكتب أمراً لـ Aiden..."
          placeholderTextColor={COLORS.textMuted}
          textAlign="right"
          returnKeyType="send"
          onSubmitEditing={handleSend}
          editable={!sending}
          multiline={false}
        />
        <TouchableOpacity
          style={[qcStyles.sendBtn, (!input.trim() || sending) && qcStyles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || sending}
          activeOpacity={0.7}
        >
          {sending
            ? <ActivityIndicator size="small" color={COLORS.primaryBg} />
            : <Feather name="send" size={16} color={COLORS.primaryBg} />
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

const qcStyles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.secondaryBg,
    borderRadius: RADIUS.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.accent + "33",
    width: Math.min(SCREEN_W - 32, 360),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  aidenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#22c55e" },
  headerTitle: { fontSize: 15, color: COLORS.textPrimary, fontWeight: "700" as const },
  headerSub: { fontSize: 10, color: COLORS.textMuted },
  closeBtn: { padding: 2 },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  chip: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipText: { fontSize: 11, color: COLORS.textSecondary },
  responseArea: {
    minHeight: 80,
    maxHeight: 180,
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  thinkingRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  thinkDot: { width: 8, height: 8, borderRadius: 4 },
  thinkText: { fontSize: 12, color: COLORS.textMuted },
  responseText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 22,
    textAlign: "right",
  },
  emptyHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    padding: SPACING.xl,
  },
  hintText: { fontSize: 12, color: COLORS.textMuted },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.primaryBg,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.textPrimary,
    fontSize: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: 80,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { opacity: 0.4 },
});

// ── Floating Bubble ──────────────────────────────────────────

export function FloatingCommandBubble() {
  const [serverUrl, setServerUrl] = useState(AIDEN_DEFAULT_URL);
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState(true);

  // Position
  const posX = useRef(new Animated.Value(SCREEN_W - BUBBLE_SIZE - BUBBLE_MARGIN)).current;
  const posY = useRef(new Animated.Value(SCREEN_H * 0.6)).current;
  const currentPos = useRef({ x: SCREEN_W - BUBBLE_SIZE - BUBBLE_MARGIN, y: SCREEN_H * 0.6 });

  // Animations
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.AIDEN_SERVER_URL).then((v) => {
      if (v) setServerUrl(v);
    });
  }, []);

  // Idle glow animation
  useEffect(() => {
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    );
    glow.start();
    return () => glow.stop();
  }, [glowAnim]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 4 || Math.abs(gs.dy) > 4,
      onPanResponderGrant: () => {
        Animated.spring(scaleAnim, { toValue: 0.9, useNativeDriver: true }).start();
      },
      onPanResponderMove: (_, gs) => {
        const newX = Math.max(0, Math.min(SCREEN_W - BUBBLE_SIZE, currentPos.current.x + gs.dx));
        const newY = Math.max(50, Math.min(SCREEN_H - BUBBLE_SIZE - 80, currentPos.current.y + gs.dy));
        posX.setValue(newX);
        posY.setValue(newY);
      },
      onPanResponderRelease: (_, gs) => {
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
        const newX = Math.max(0, Math.min(SCREEN_W - BUBBLE_SIZE, currentPos.current.x + gs.dx));
        const newY = Math.max(50, Math.min(SCREEN_H - BUBBLE_SIZE - 80, currentPos.current.y + gs.dy));

        // Snap to nearest edge
        const snapX = newX < SCREEN_W / 2 ? BUBBLE_MARGIN : SCREEN_W - BUBBLE_SIZE - BUBBLE_MARGIN;
        Animated.spring(posX, { toValue: snapX, useNativeDriver: false, friction: 7 }).start();
        posY.setValue(newY);
        currentPos.current = { x: snapX, y: newY };
      },
    })
  ).current;

  const handlePress = useCallback(() => {
    Animated.sequence([
      Animated.timing(rotateAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(rotateAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
    setExpanded((prev) => !prev);
  }, [rotateAnim]);

  const spin = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "15deg"] });
  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.6] });

  if (!visible) return null;

  return (
    <>
      {/* Floating bubble */}
      <Animated.View
        style={[
          fbStyles.bubbleWrapper,
          {
            left: posX,
            top: posY,
            transform: [{ scale: scaleAnim }, { rotate: spin }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Glow ring */}
        <Animated.View style={[fbStyles.glowRing, { opacity: glowOpacity }]} />

        <TouchableOpacity
          style={fbStyles.bubble}
          onPress={handlePress}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={expanded ? ["#D4A853", "#A07830"] : ["#1A2C4E", "#0F1829"]}
            style={fbStyles.bubbleGradient}
          >
            <Feather
              name={expanded ? "x" : "zap"}
              size={22}
              color={expanded ? COLORS.primaryBg : COLORS.accent}
            />
          </LinearGradient>
        </TouchableOpacity>

        {/* Hide button */}
        {!expanded && (
          <TouchableOpacity
            style={fbStyles.hideBtn}
            onPress={() => setVisible(false)}
            activeOpacity={0.7}
          >
            <Feather name="minus" size={8} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Expanded panel modal */}
      <Modal
        visible={expanded}
        transparent
        animationType="fade"
        onRequestClose={() => setExpanded(false)}
      >
        <TouchableOpacity
          style={fbStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setExpanded(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={fbStyles.modalContent}
          >
            <TouchableOpacity activeOpacity={1} onPress={() => {}}>
              <QuickChatPanel serverUrl={serverUrl} onClose={() => setExpanded(false)} />
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const fbStyles = StyleSheet.create({
  bubbleWrapper: {
    position: "absolute",
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    zIndex: 9999,
  },
  glowRing: {
    position: "absolute",
    width: BUBBLE_SIZE + 16,
    height: BUBBLE_SIZE + 16,
    borderRadius: (BUBBLE_SIZE + 16) / 2,
    backgroundColor: COLORS.accent,
    top: -8,
    left: -8,
  },
  bubble: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    overflow: "hidden",
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 12,
  },
  bubbleGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  hideBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: COLORS.secondaryBg,
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xl,
  },
  modalContent: { width: "100%", alignItems: "center" },
});
