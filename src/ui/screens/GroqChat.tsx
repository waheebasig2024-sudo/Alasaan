/**
 * شاشة الدردشة مع Groq — مع إنترنت
 * تستخدم Groq API (llama-3.3-70b) عبر API Server
 */
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  FlatList,
  Pressable,
  ToastAndroid,
  Clipboard,
  Alert,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { COLORS } from "../theme/colors";
import { SPACING, RADIUS, SIZES } from "../theme/spacing";
import { TYPOGRAPHY } from "../theme/typography";
import { generateId } from "../../utils/text";
import { now } from "../../utils/time";

const CHAT_KEY = "@groq_chat_v2";

function resolveApiBase(): string {
  try {
    const extra = (Constants.expoConfig?.extra as Record<string, unknown>) ?? {};
    const domain = (extra.apiDomain as string) || "";
    if (!domain) return "";
    const clean = domain.replace(/^https?:\/\//, "").replace(/\/+$/, "");
    return `https://${clean}/api`;
  } catch {
    return "";
  }
}

interface Message {
  id: string;
  role: "user" | "assistant" | "info";
  content: string;
  timestamp: number;
  streaming?: boolean;
}

function Bubble({ msg, onCopy }: { msg: Message; onCopy: (t: string) => void }) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(10)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [fade, slide]);

  if (msg.role === "info") {
    return (
      <View style={bs.infoRow}>
        <Feather name="info" size={11} color={COLORS.textMuted} />
        <Text style={bs.infoText}>{msg.content}</Text>
      </View>
    );
  }

  const isUser = msg.role === "user";
  return (
    <Animated.View style={[bs.row, isUser ? bs.rowUser : bs.rowAI, { opacity: fade, transform: [{ translateY: slide }] }]}>
      {!isUser && (
        <View style={bs.avatar}>
          <Text style={bs.avatarTxt}>H</Text>
        </View>
      )}
      <Pressable
        onLongPress={() => onCopy(msg.content)}
        delayLongPress={400}
        style={[bs.bubble, isUser ? bs.bUser : bs.bAI]}
      >
        <Text selectable style={[bs.text, isUser ? bs.tUser : bs.tAI]}>
          {msg.content}
        </Text>
        {msg.streaming && <Text style={bs.cursor}>▌</Text>}
      </Pressable>
    </Animated.View>
  );
}

const bs = StyleSheet.create({
  row: { flexDirection: "row", marginBottom: SPACING.sm, alignItems: "flex-end", gap: SPACING.xs, paddingHorizontal: SPACING.md },
  rowUser: { justifyContent: "flex-end" },
  rowAI: { justifyContent: "flex-start" },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.accent, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  avatarTxt: { color: COLORS.primaryBg, fontWeight: "700" as const, fontSize: 12 },
  bubble: { maxWidth: "80%", borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  bUser: { backgroundColor: COLORS.accent, borderBottomRightRadius: 4 },
  bAI: { backgroundColor: COLORS.secondaryBg, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: COLORS.border },
  text: { fontSize: TYPOGRAPHY.md, lineHeight: 22 },
  tUser: { color: COLORS.primaryBg, textAlign: "right" },
  tAI: { color: COLORS.textPrimary, textAlign: "right" },
  infoRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, marginVertical: SPACING.xs, paddingHorizontal: SPACING.lg },
  infoText: { fontSize: TYPOGRAPHY.xs, color: COLORS.textMuted, fontStyle: "italic" as const, textAlign: "center" },
  cursor: { color: COLORS.accent, fontSize: 16 },
});

const SUGGESTIONS = ["ما هو الذكاء الاصطناعي؟", "ساعدني في كتابة رسالة", "ترجم: Hello World", "أخبرني نكتة"];

export default function GroqChatScreen() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [connected, setConnected] = useState<boolean | null>(null);
  const flatRef = useRef<FlatList>(null);
  const abortRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(CHAT_KEY).then((s) => { if (s) setMessages(JSON.parse(s)); }).catch(() => {});
    checkConn();
  }, []);

  const checkConn = useCallback(async () => {
    const base = resolveApiBase();
    if (!base) { setConnected(false); return; }
    try {
      const r = await fetch(`${base}/health`, { signal: AbortSignal.timeout(5000) });
      setConnected(r.ok);
    } catch { setConnected(false); }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      AsyncStorage.setItem(CHAT_KEY, JSON.stringify(messages.filter((m) => !m.streaming).slice(-40))).catch(() => {});
    }
  }, [messages]);

  const scrollBottom = useCallback(() => {
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 80);
  }, []);

  useEffect(() => { scrollBottom(); }, [messages.length, scrollBottom]);

  const copyText = useCallback((t: string) => {
    Clipboard.setString(t);
    if (Platform.OS === "android") ToastAndroid.show("تم النسخ ✓", ToastAndroid.SHORT);
  }, []);

  const send = useCallback(async (text: string) => {
    const msg = text.trim();
    if (!msg || isSending) return;

    const base = resolveApiBase();
    if (!base) {
      Alert.alert("خطأ", "تأكد من اتصالك بالإنترنت");
      return;
    }
    if (connected === null) {
      Alert.alert("جاري الفحص", "يتم التحقق من الاتصال بالخادم، انتظر لحظة ثم أعد المحاولة.");
      return;
    }
    if (connected === false) {
      Alert.alert("غير متصل", "الخادم غير متاح حالياً. تحقق من اتصال الإنترنت وحاول مرة أخرى.");
      return;
    }

    const userMsg: Message = { id: generateId(), role: "user", content: msg, timestamp: now() };
    const aiId = generateId();
    const aiMsg: Message = { id: aiId, role: "assistant", content: "", timestamp: now(), streaming: true };

    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setInput("");
    setIsSending(true);

    const history = messages
      .filter((m) => (m.role === "user" || m.role === "assistant") && !m.streaming)
      .slice(-20)
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    let accumulated = "";
    let aborted = false;
    const ctrl = new AbortController();
    abortRef.current = () => { aborted = true; ctrl.abort(); };

    try {
      const res = await fetch(`${base}/groq-chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history }),
        signal: ctrl.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body?.getReader();
      if (!reader) throw new Error("لا يمكن قراءة الاستجابة");

      const dec = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done || aborted) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith("data: ")) continue;
          const j = t.slice(6).trim();
          if (j === "[DONE]") break;
          try {
            const chunk = JSON.parse(j) as { token?: string; done?: boolean; error?: string };
            if (chunk.error) { accumulated = `❌ ${chunk.error}`; break; }
            if (chunk.token) {
              accumulated += chunk.token;
              setMessages((prev) => prev.map((m) => m.id === aiId ? { ...m, content: accumulated, streaming: true } : m));
            }
            if (chunk.done) break;
          } catch { /* skip */ }
        }
      }
    } catch (err: unknown) {
      if (!aborted) accumulated = `❌ ${err instanceof Error ? err.message : "خطأ في الشبكة"}`;
    }

    setMessages((prev) =>
      prev.map((m) => m.id === aiId ? { ...m, content: accumulated || "لم أتلق رداً.", streaming: false } : m)
    );
    setIsSending(false);
    abortRef.current = null;
    scrollBottom();
  }, [connected, isSending, messages, scrollBottom]);

  const clearChat = useCallback(() => {
    Alert.alert("مسح المحادثة", "هل أنت متأكد؟", [
      { text: "إلغاء", style: "cancel" },
      { text: "مسح", style: "destructive", onPress: () => { setMessages([]); AsyncStorage.removeItem(CHAT_KEY).catch(() => {}); } },
    ]);
  }, []);

  const pb = Math.max(insets.bottom, SPACING.sm);

  return (
    <KeyboardAvoidingView style={[s.container, { paddingTop: insets.top }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.iconBtn} activeOpacity={0.7}>
          <Feather name="arrow-right" size={22} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.title}>الحسن السريع</Text>
          <View style={s.badge}>
            <View style={[s.dot, { backgroundColor: connected === null ? "#eab308" : connected ? "#22c55e" : "#ef4444" }]} />
            <Text style={s.sub}>{connected === null ? "جاري الفحص..." : connected ? "Groq · LLaMA 3.3" : "لا يوجد اتصال"}</Text>
          </View>
        </View>
        <View style={s.headerRight}>
          <TouchableOpacity onPress={checkConn} style={s.iconBtn} activeOpacity={0.7}>
            <Feather name="refresh-cw" size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={clearChat} style={s.iconBtn} activeOpacity={0.7}>
            <Feather name="trash-2" size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Feature chips */}
      <View style={s.chips}>
        {[{ icon: "zap" as const, label: "فوري" }, { icon: "cpu" as const, label: "LLaMA 70B" }, { icon: "globe" as const, label: "عربي + إنجليزي" }].map((c) => (
          <View key={c.label} style={s.chip}>
            <Feather name={c.icon} size={11} color={COLORS.accent} />
            <Text style={s.chipTxt}>{c.label}</Text>
          </View>
        ))}
      </View>

      {/* Empty state */}
      {messages.length === 0 && (
        <View style={s.empty}>
          <View style={s.emptyIcon}><Feather name="message-circle" size={36} color={COLORS.accent} /></View>
          <Text style={s.emptyTitle}>تحدث مع الحسن السريع</Text>
          <Text style={s.emptyDesc}>مدعوم بـ Groq / LLaMA 3.3 · 70B — أسرع نموذج في العالم</Text>
          <View style={s.suggs}>
            {SUGGESTIONS.map((sg) => (
              <TouchableOpacity key={sg} style={s.sugg} onPress={() => send(sg)} activeOpacity={0.75}>
                <Text style={s.suggTxt}>{sg}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Messages */}
      <FlatList
        ref={flatRef}
        data={messages}
        renderItem={({ item }) => <Bubble msg={item} onCopy={copyText} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={false}
      />

      {/* Input */}
      <View style={[s.inputWrap, { paddingBottom: pb }]}>
        <View style={s.inputRow}>
          {isSending && (
            <TouchableOpacity style={s.stopBtn} onPress={() => abortRef.current?.()} activeOpacity={0.8}>
              <Feather name="square" size={SIZES.iconMd} color={COLORS.primaryBg} />
            </TouchableOpacity>
          )}
          <TextInput
            style={[s.input, isSending && s.inputBusy]}
            value={input}
            onChangeText={setInput}
            placeholder={isSending ? "الحسن يفكر..." : "اكتب رسالتك..."}
            placeholderTextColor={COLORS.textMuted}
            multiline
            maxLength={2000}
            textAlign="right"
            returnKeyType="send"
            onSubmitEditing={() => send(input)}
            blurOnSubmit={false}
            editable={!isSending}
          />
          <TouchableOpacity
            style={[s.sendBtn, (!input.trim() || isSending) && s.sendBtnOff]}
            onPress={() => send(input)}
            disabled={!input.trim() || isSending}
            activeOpacity={0.8}
          >
            {isSending ? <ActivityIndicator size="small" color={COLORS.primaryBg} /> : <Feather name="send" size={SIZES.iconMd} color={COLORS.primaryBg} />}
          </TouchableOpacity>
        </View>
        <Text style={s.hint}>{isSending ? "⏳ جاري التفكير — اضغط ■ للإيقاف" : "اضغط إرسال أو Enter"}</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primaryBg },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: SPACING.sm },
  headerCenter: { flex: 1, alignItems: "center", gap: 3 },
  title: { fontSize: TYPOGRAPHY.lg, fontWeight: "700" as const, color: COLORS.textPrimary },
  badge: { flexDirection: "row", alignItems: "center", gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  sub: { fontSize: TYPOGRAPHY.xs, color: COLORS.textMuted },
  headerRight: { flexDirection: "row", gap: SPACING.xs },
  iconBtn: { padding: SPACING.sm, borderRadius: RADIUS.md },
  chips: { flexDirection: "row", justifyContent: "center", gap: SPACING.sm, paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border + "50" },
  chip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: COLORS.accent + "15", borderRadius: RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: 3, borderWidth: 1, borderColor: COLORS.accent + "30" },
  chipTxt: { fontSize: 10, color: COLORS.accent, fontWeight: "600" as const },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: SPACING.xl, gap: SPACING.md },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.accent + "15", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.accent + "30" },
  emptyTitle: { fontSize: TYPOGRAPHY.xl, fontWeight: "700" as const, color: COLORS.textPrimary, textAlign: "center" },
  emptyDesc: { fontSize: TYPOGRAPHY.sm, color: COLORS.textSecondary, textAlign: "center", lineHeight: 20 },
  suggs: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: SPACING.sm, marginTop: SPACING.sm },
  sugg: { backgroundColor: COLORS.secondaryBg, borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderWidth: 1, borderColor: COLORS.border },
  suggTxt: { fontSize: TYPOGRAPHY.sm, color: COLORS.textSecondary },
  list: { paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  inputWrap: { backgroundColor: COLORS.secondaryBg, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.md, paddingHorizontal: SPACING.md, gap: SPACING.xs },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: SPACING.sm },
  input: { flex: 1, minHeight: SIZES.inputHeight, maxHeight: 120, backgroundColor: COLORS.surfaceBg, borderRadius: RADIUS.xl, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, fontSize: TYPOGRAPHY.md, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border, writingDirection: "rtl" },
  inputBusy: { borderColor: COLORS.accent + "40" },
  sendBtn: { width: 48, height: 48, borderRadius: RADIUS.full, backgroundColor: COLORS.accent, alignItems: "center", justifyContent: "center", shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5, flexShrink: 0 },
  sendBtnOff: { backgroundColor: COLORS.surfaceBg, shadowOpacity: 0, elevation: 0 },
  stopBtn: { width: 48, height: 48, borderRadius: RADIUS.full, backgroundColor: COLORS.error, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  hint: { fontSize: TYPOGRAPHY.xs, color: COLORS.textMuted, textAlign: "center", paddingBottom: SPACING.xs },
});
