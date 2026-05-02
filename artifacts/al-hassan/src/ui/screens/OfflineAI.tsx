import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Clipboard,
  Pressable,
  ToastAndroid,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "../theme/colors";
import { SPACING, RADIUS } from "../theme/spacing";
import { TYPOGRAPHY } from "../theme/typography";
import {
  checkAidenConnection,
  sendMessageToAiden,
  ConnectionStatus,
} from "../../services/aiden.service";
import { AIDEN_DEFAULT_URL } from "../../config/aiden.config";
import { STORAGE_KEYS } from "../../constants/storage-keys";
import { generateId } from "../../utils/text";
import { now } from "../../utils/time";

// ── أوامر التشغيل التلقائي ──────────────────────────────────

const AUTO_START_STEPS = [
  {
    title: "الخطوة 1 — افتح Termux وادخل Kali",
    desc: "نفّذ هذا الأمر في Termux للدخول إلى بيئة Kali Linux",
    cmd: "nh",
  },
  {
    title: "الخطوة 2 — أنشئ الاختصار (داخل Kali)",
    desc: "نفّذه مرة واحدة فقط — يتجنب مشاكل الاقتباسات",
    cmd: `printf '%s\\n' "alias aiden='cd ~/aiden_setup/aiden-main && AIDEN_PORT=4200 node dist-bundle/index.js serve'" >> ~/.bashrc`,
  },
  {
    title: "الخطوة 3 — فعّل التغيير",
    desc: "شغّل هذا الأمر مرة واحدة بعد الخطوة الثانية",
    cmd: "source ~/.bashrc",
  },
  {
    title: "الآن وإلى الأبد",
    desc: "كل مرة تفتح Termux: ادخل Kali ثم شغّل Aiden بكلمة واحدة",
    cmd: "aiden",
  },
];

function AutoStartModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleCopy = (text: string, idx: number) => {
    Clipboard.setString(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          {/* Header */}
          <View style={modalStyles.sheetHeader}>
            <Text style={modalStyles.sheetTitle}>⚡ تشغيل Aiden تلقائياً</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={modalStyles.closeBtn}>
              <Feather name="x" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={modalStyles.sheetDesc}>
            نفّذ هذه الخطوات مرة واحدة في Termux — بعدها تشغّل Aiden بكلمة واحدة فقط كل مرة
          </Text>

          {/* Steps */}
          {AUTO_START_STEPS.map((step, idx) => (
            <View key={idx} style={modalStyles.stepCard}>
              <View style={modalStyles.stepHeader}>
                <View style={modalStyles.stepNum}>
                  <Text style={modalStyles.stepNumText}>{idx + 1}</Text>
                </View>
                <View style={modalStyles.stepInfo}>
                  <Text style={modalStyles.stepTitle}>{step.title}</Text>
                  <Text style={modalStyles.stepDesc}>{step.desc}</Text>
                </View>
              </View>
              <View style={modalStyles.cmdRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={modalStyles.cmdScroll}>
                  <Text style={modalStyles.cmdText}>{step.cmd}</Text>
                </ScrollView>
                <TouchableOpacity
                  style={[modalStyles.copyBtn, copiedIdx === idx && modalStyles.copyBtnDone]}
                  onPress={() => handleCopy(step.cmd, idx)}
                  activeOpacity={0.75}
                >
                  <Feather
                    name={copiedIdx === idx ? "check" : "copy"}
                    size={14}
                    color={copiedIdx === idx ? "#22c55e" : COLORS.textMuted}
                  />
                  <Text style={[modalStyles.copyText, copiedIdx === idx && modalStyles.copyTextDone]}>
                    {copiedIdx === idx ? "تم النسخ" : "نسخ"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Tip */}
          <View style={modalStyles.tip}>
            <Feather name="info" size={13} color={COLORS.accent} />
            <Text style={modalStyles.tipText}>
              افتح Termux ← اكتب <Text style={modalStyles.tipCode}>nh</Text> للدخول لـ Kali ← نفّذ الخطوات 2 و3 مرة واحدة ← بعدها اكتب{" "}
              <Text style={modalStyles.tipCode}>aiden</Text> فقط
            </Text>
          </View>

          <TouchableOpacity style={modalStyles.doneBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={modalStyles.doneBtnText}>فهمت، شكراً</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.secondaryBg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl + 8,
    paddingTop: SPACING.md,
    gap: SPACING.md,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: COLORS.textPrimary,
  },
  closeBtn: {
    padding: SPACING.xs,
  },
  sheetDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
    textAlign: "right",
  },
  stepCard: {
    backgroundColor: COLORS.primaryBg,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepHeader: {
    flexDirection: "row",
    gap: SPACING.sm,
    alignItems: "flex-start",
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  stepNumText: {
    color: COLORS.primaryBg,
    fontWeight: "700" as const,
    fontSize: 12,
  },
  stepInfo: { flex: 1 },
  stepTitle: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: COLORS.textPrimary,
    textAlign: "right",
  },
  stepDesc: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    textAlign: "right",
  },
  cmdRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0d1117",
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: "#30363d",
  },
  cmdScroll: { flex: 1 },
  cmdText: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 11,
    color: "#58a6ff",
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.secondaryBg,
  },
  copyBtnDone: {
    borderColor: "#22c55e33",
    backgroundColor: "#14532d22",
  },
  copyText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  copyTextDone: {
    color: "#22c55e",
  },
  tip: {
    flexDirection: "row",
    gap: SPACING.xs,
    alignItems: "flex-start",
    backgroundColor: COLORS.accent + "11",
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.accent + "33",
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
    textAlign: "right",
  },
  tipCode: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    color: COLORS.accent,
    fontWeight: "700" as const,
  },
  doneBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: "center",
    marginTop: SPACING.xs,
  },
  doneBtnText: {
    color: COLORS.primaryBg,
    fontWeight: "700" as const,
    fontSize: 15,
  },
});

// ── أنواع ──────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant" | "activity";
  content: string;
  timestamp: number;
  provider?: string;
  imageUri?: string;
}

// ── مكوّن نقطة حالة الاتصال ────────────────────────────────

function ConnectionDot({ status }: { status: ConnectionStatus }) {
  const color =
    status === "connected"
      ? "#22c55e"
      : status === "checking"
      ? "#eab308"
      : "#ef4444";

  const label =
    status === "connected"
      ? "متصل"
      : status === "checking"
      ? "جاري الفحص..."
      : "غير متصل";

  return (
    <View style={dotStyles.wrapper}>
      <View style={[dotStyles.dot, { backgroundColor: color }]} />
      <Text style={[dotStyles.label, { color }]}>{label}</Text>
    </View>
  );
}

const dotStyles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: "600" as const,
  },
});

// ── مكوّن رسالة ────────────────────────────────────────────

function MessageBubble({ msg }: { msg: Message }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback((text: string) => {
    Clipboard.setString(text);
    setCopied(true);
    if (Platform.OS === "android") ToastAndroid.show("تم النسخ ✓", ToastAndroid.SHORT);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  if (msg.role === "activity") {
    return (
      <View style={msgStyles.activityRow}>
        <Feather name="settings" size={11} color={COLORS.textMuted} />
        <Text style={msgStyles.activityText}>{msg.content}</Text>
      </View>
    );
  }

  const isUser = msg.role === "user";
  return (
    <View style={[msgStyles.row, isUser ? msgStyles.rowUser : msgStyles.rowAI]}>
      {!isUser && (
        <View style={msgStyles.avatar}>
          <Text style={msgStyles.avatarText}>A</Text>
        </View>
      )}
      <Pressable
        onLongPress={() => handleCopy(msg.content)}
        delayLongPress={400}
        style={[msgStyles.bubble, isUser ? msgStyles.bubbleUser : msgStyles.bubbleAI, copied && msgStyles.bubbleCopied]}
      >
        {msg.imageUri && (
          <Image
            source={{ uri: msg.imageUri }}
            style={msgStyles.messageImage}
            resizeMode="cover"
          />
        )}
        {msg.content ? (
          <Text
            selectable
            style={[msgStyles.text, isUser ? msgStyles.textUser : msgStyles.textAI]}
          >
            {msg.content}
          </Text>
        ) : null}
        <View style={msgStyles.msgFooter}>
          {copied && (
            <View style={msgStyles.copiedRow}>
              <Feather name="check" size={10} color={COLORS.success} />
              <Text style={msgStyles.copiedText}>تم النسخ</Text>
            </View>
          )}
          {msg.provider && <Text style={msgStyles.provider}>via {msg.provider}</Text>}
        </View>
      </Pressable>
    </View>
  );
}

const msgStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginBottom: SPACING.sm,
    alignItems: "flex-end",
    gap: SPACING.xs,
  },
  rowUser: { justifyContent: "flex-end" },
  rowAI: { justifyContent: "flex-start" },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#1e40af",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "700" as const, fontSize: 12 },
  bubble: {
    maxWidth: "78%",
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  bubbleUser: {
    backgroundColor: COLORS.accent,
    borderBottomRightRadius: 4,
  },
  bubbleAI: {
    backgroundColor: COLORS.secondaryBg,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  text: { fontSize: 14, lineHeight: 20 },
  textUser: { color: COLORS.primaryBg, textAlign: "right" },
  textAI: { color: COLORS.textPrimary, textAlign: "right" },
  provider: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: "left",
  },
  activityRow: {
    flexDirection: "row" as const,
    alignItems: "center",
    marginVertical: SPACING.xs,
    gap: 5,
    justifyContent: "center",
  },
  activityText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontStyle: "italic" as const,
  },
  messageImage: {
    width: "100%" as any,
    height: 180,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.xs,
  },
  bubbleCopied: {
    borderWidth: 1.5,
    borderColor: COLORS.success,
  },
  msgFooter: {
    flexDirection: "row" as const,
    alignItems: "center",
    marginTop: 4,
    gap: 6,
  },
  copiedRow: {
    flexDirection: "row" as const,
    alignItems: "center",
    gap: 3,
  },
  copiedText: {
    fontSize: 10,
    color: COLORS.success,
    fontWeight: "600" as const,
  },
});

// ── الشاشة الرئيسية ─────────────────────────────────────────

const CHAT_KEY = "@aiden_offline_chat";

export default function OfflineAIScreen() {
  const insets = useSafeAreaInsets();

  const [serverUrl, setServerUrl] = useState(AIDEN_DEFAULT_URL);
  const [editingUrl, setEditingUrl] = useState(false);
  const [urlDraft, setUrlDraft] = useState(AIDEN_DEFAULT_URL);

  const [connStatus, setConnStatus] = useState<ConnectionStatus>("checking");
  const [connVersion, setConnVersion] = useState<string | undefined>();
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [isPinging, setIsPinging] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [showAutoStart, setShowAutoStart] = useState(false);

  const flatRef = useRef<FlatList>(null);
  const sessionId = useRef(`mobile-${Date.now()}`);
  const streamingIdRef = useRef<string | null>(null);

  // ── تحميل الإعدادات المحفوظة ──────────────────────────────

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEYS.AIDEN_SERVER_CONFIG);
        if (saved) {
          const { url } = JSON.parse(saved);
          if (url) {
            setServerUrl(url);
            setUrlDraft(url);
          }
        }
        const savedChat = await AsyncStorage.getItem(CHAT_KEY);
        if (savedChat) {
          setMessages(JSON.parse(savedChat));
        }
      } catch {}
    })();
  }, []);

  // ── فحص الاتصال عند تغيير serverUrl ─────────────────────

  const checkConn = useCallback(
    async (url: string) => {
      setConnStatus("checking");
      const result = await checkAidenConnection(url);
      setConnStatus(result.status);
      setConnVersion(result.version);
    },
    []
  );

  useEffect(() => {
    checkConn(serverUrl);
    const interval = setInterval(() => checkConn(serverUrl), 15000);
    return () => clearInterval(interval);
  }, [serverUrl, checkConn]);

  // ── حفظ المحادثة ─────────────────────────────────────────

  useEffect(() => {
    if (messages.length > 0) {
      AsyncStorage.setItem(CHAT_KEY, JSON.stringify(messages.slice(-100))).catch(() => {});
    }
  }, [messages]);

  // ── تمرير للأسفل عند رسالة جديدة ─────────────────────────

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length, streamingText]);

  // ── حفظ عنوان السيرفر ────────────────────────────────────

  const saveServerUrl = async (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setServerUrl(trimmed);
    setEditingUrl(false);
    await AsyncStorage.setItem(
      STORAGE_KEYS.AIDEN_SERVER_CONFIG,
      JSON.stringify({ url: trimmed })
    );
    checkConn(trimmed);
  };

  // ── اختيار الصورة ────────────────────────────────────────

  const handlePickImage = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("الإذن مطلوب", "يرجى السماح للتطبيق بالوصول للصور.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      base64: true,
    });

    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const uri = asset.uri;
    const b64 = asset.base64;

    if (!b64) {
      Alert.alert("خطأ", "لا يمكن قراءة الصورة.");
      return;
    }

    const userMsg: Message = {
      id: generateId(),
      role: "user",
      content: input.trim() || "أرسلت صورة:",
      timestamp: now(),
      imageUri: uri,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsSending(true);
    setStreamingText("");

    const aiMsgId = generateId();
    streamingIdRef.current = aiMsgId;
    let accumulated = "";

    // Send image description request to Aiden
    const imagePrompt = input.trim()
      ? `${input.trim()}\n[صورة مرفقة — base64: data:image/jpeg;base64,${b64.substring(0, 200)}...]`
      : `انظر إلى هذه الصورة وأخبرني عنها:\n[base64: data:image/jpeg;base64,${b64.substring(0, 200)}...]`;

    await sendMessageToAiden(
      serverUrl,
      { message: imagePrompt, session: sessionId.current },
      (token) => { accumulated += token; setStreamingText(accumulated); },
      (activity) => {
        if (activity) {
          setMessages((prev) => [...prev, {
            id: generateId(), role: "activity",
            content: `${activity.icon} ${activity.message}`, timestamp: now(),
          }]);
        }
      },
      (provider) => {
        setMessages((prev) => [...prev, {
          id: aiMsgId, role: "assistant",
          content: accumulated || "لم تصلني إجابة.", timestamp: now(), provider,
        }]);
        setStreamingText(""); setIsSending(false); streamingIdRef.current = null;
      },
      (error) => {
        setMessages((prev) => [...prev, {
          id: generateId(), role: "assistant",
          content: `❌ خطأ: ${error}`, timestamp: now(),
        }]);
        setStreamingText(""); setIsSending(false); streamingIdRef.current = null;
      }
    );
  }, [input, isSending, serverUrl]);

  // ── إرسال الرسالة ─────────────────────────────────────────

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isSending) return;

    const userMsg: Message = {
      id: generateId(),
      role: "user",
      content: text,
      timestamp: now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsSending(true);
    setStreamingText("");

    const aiMsgId = generateId();
    streamingIdRef.current = aiMsgId;
    let accumulated = "";

    await sendMessageToAiden(
      serverUrl,
      { message: text, session: sessionId.current },
      (token) => {
        accumulated += token;
        setStreamingText(accumulated);
      },
      (activity) => {
        if (activity) {
          const actMsg: Message = {
            id: generateId(),
            role: "activity",
            content: `${activity.icon} ${activity.message}`,
            timestamp: now(),
          };
          setMessages((prev) => [...prev, actMsg]);
        }
      },
      (provider) => {
        const aiMsg: Message = {
          id: aiMsgId,
          role: "assistant",
          content: accumulated || "لم تصلني إجابة من السيرفر.",
          timestamp: now(),
          provider,
        };
        setMessages((prev) => [...prev, aiMsg]);
        setStreamingText("");
        setIsSending(false);
        streamingIdRef.current = null;
      },
      (error) => {
        const errMsg: Message = {
          id: generateId(),
          role: "assistant",
          content: `❌ خطأ في الاتصال: ${error}`,
          timestamp: now(),
        };
        setMessages((prev) => [...prev, errMsg]);
        setStreamingText("");
        setIsSending(false);
        streamingIdRef.current = null;
      }
    );
  }, [input, isSending, serverUrl]);

  // ── Ping — قياس سرعة الاستجابة ──────────────────────────

  const handlePing = useCallback(async () => {
    if (isPinging) return;
    setIsPinging(true);
    setPingMs(null);
    const start = Date.now();
    const result = await checkAidenConnection(serverUrl);
    const elapsed = Date.now() - start;
    setConnStatus(result.status);
    setConnVersion(result.version);
    if (result.status === "connected") {
      setPingMs(elapsed);
    } else {
      setPingMs(null);
    }
    setIsPinging(false);
  }, [isPinging, serverUrl]);

  // ── إعادة التعيين لـ localhost ────────────────────────────

  const handleResetToLocalhost = useCallback(async () => {
    const localUrl = "http://127.0.0.1:4200";
    setServerUrl(localUrl);
    setUrlDraft(localUrl);
    await AsyncStorage.setItem(
      STORAGE_KEYS.AIDEN_SERVER_CONFIG,
      JSON.stringify({ url: localUrl })
    );
    checkConn(localUrl);
  }, [checkConn]);

  // ── مسح المحادثة ─────────────────────────────────────────

  const handleClear = () => {
    Alert.alert("مسح المحادثة", "هل تريد مسح محادثة Aiden؟", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "مسح",
        style: "destructive",
        onPress: () => {
          setMessages([]);
          AsyncStorage.removeItem(CHAT_KEY).catch(() => {});
        },
      },
    ]);
  };

  // ── قائمة البيانات ────────────────────────────────────────

  const displayMessages = [
    ...messages,
    ...(isSending && streamingText
      ? [
          {
            id: "__streaming__",
            role: "assistant" as const,
            content: streamingText + " ▌",
            timestamp: now(),
          },
        ]
      : []),
  ];

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-right" size={22} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>بدون نت</Text>
          <Text style={styles.headerSub}>Aiden · Kali Linux</Text>
        </View>

        <View style={styles.headerRight}>
          <ConnectionDot status={connStatus} />
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => checkConn(serverUrl)}
            activeOpacity={0.7}
          >
            <Feather name="refresh-cw" size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, styles.autoBtn]}
            onPress={() => setShowAutoStart(true)}
            activeOpacity={0.7}
            accessibilityLabel="تشغيل Aiden تلقائياً"
          >
            <Feather name="zap" size={16} color="#eab308" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={handleClear}
            activeOpacity={0.7}
          >
            <Feather name="trash-2" size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Server URL Bar ─── */}
      <View style={styles.serverBar}>
        {editingUrl ? (
          <View style={styles.urlEditRow}>
            <TextInput
              style={styles.urlInput}
              value={urlDraft}
              onChangeText={setUrlDraft}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              placeholder="http://192.168.1.100:4200"
              placeholderTextColor={COLORS.textMuted}
              returnKeyType="done"
              onSubmitEditing={() => saveServerUrl(urlDraft)}
            />
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() => saveServerUrl(urlDraft)}
              activeOpacity={0.7}
            >
              <Text style={styles.saveBtnText}>حفظ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                setEditingUrl(false);
                setUrlDraft(serverUrl);
              }}
              activeOpacity={0.7}
            >
              <Feather name="x" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.urlRow}
            onPress={() => setEditingUrl(true)}
            activeOpacity={0.7}
          >
            <Feather name="server" size={13} color={connStatus === "connected" ? "#22c55e" : COLORS.textMuted} />
            <Text style={styles.urlText} numberOfLines={1}>
              {serverUrl}
            </Text>
            {connVersion && (
              <View style={styles.versionBadge}>
                <Text style={styles.versionText}>v{connVersion}</Text>
              </View>
            )}
            <Feather name="edit-2" size={12} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* ─── Connection Warning ─── */}
      {connStatus === "disconnected" || connStatus === "error" ? (
        <View style={styles.warningBar}>
          <Feather name="alert-circle" size={14} color="#ef4444" />
          <Text style={styles.warningText}>
            السيرفر غير متاح — تأكد أن Aiden يعمل على Kali Linux
          </Text>
          <TouchableOpacity onPress={handleResetToLocalhost} style={styles.resetBtn}>
            <Feather name="home" size={12} color="#eab308" />
            <Text style={styles.resetText}>localhost</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePing}>
            <Text style={styles.retryText}>فحص</Text>
          </TouchableOpacity>
        </View>
      ) : connStatus === "connected" ? (
        <View style={styles.connectedBar}>
          <Feather name="check-circle" size={14} color="#22c55e" />
          <Text style={styles.connectedText}>
            متصل بـ Aiden {connVersion ? `v${connVersion}` : ""}
          </Text>
          {pingMs !== null && (
            <View style={styles.pingBadge}>
              <Text style={styles.pingText}>{pingMs}ms</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.pingBtn}
            onPress={handlePing}
            disabled={isPinging}
            activeOpacity={0.7}
          >
            {isPinging ? (
              <ActivityIndicator size="small" color={COLORS.accent} style={{ width: 14, height: 14 }} />
            ) : (
              <Feather name="activity" size={13} color={COLORS.accent} />
            )}
            <Text style={styles.pingBtnText}>{isPinging ? "..." : "Ping"}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* ─── Messages ─── */}
      {displayMessages.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.aidenLogo}>
            <Text style={styles.aidenLogoText}>A</Text>
          </View>
          <Text style={styles.emptyTitle}>Aiden جاهز</Text>
          <Text style={styles.emptyDesc}>
            يعمل على Kali Linux بدون انترنت خارجي.{"\n"}
            اكتب رسالتك وسيرد مباشرةً من جهازك.
          </Text>
          <View style={styles.quickChips}>
            {["ما حالك؟", "افحص الشبكة", "اعرض الملفات", "ما وقتي المتاح؟"].map(
              (q) => (
                <TouchableOpacity
                  key={q}
                  style={styles.chip}
                  onPress={() => setInput(q)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.chipText}>{q}</Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </View>
      ) : (
        <FlatList
          ref={flatRef}
          data={displayMessages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble msg={item} />}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            flatRef.current?.scrollToEnd({ animated: true })
          }
        />
      )}

      {/* ─── Typing Indicator ─── */}
      {isSending && !streamingText && (
        <View style={styles.typingRow}>
          <ActivityIndicator size="small" color={COLORS.accent} />
          <Text style={styles.typingText}>Aiden يفكر...</Text>
        </View>
      )}

      {/* ─── Input ─── */}
      <View
        style={[
          styles.inputBar,
          { paddingBottom: Math.max(insets.bottom, SPACING.md) },
        ]}
      >
        <TouchableOpacity
          style={styles.attachBtn}
          onPress={handlePickImage}
          disabled={isSending}
          activeOpacity={0.7}
        >
          <Feather name="image" size={20} color={isSending ? COLORS.textMuted : COLORS.accent} />
        </TouchableOpacity>
        <TextInput
          style={styles.textInput}
          value={input}
          onChangeText={setInput}
          placeholder="اكتب رسالتك لـ Aiden..."
          placeholderTextColor={COLORS.textMuted}
          multiline
          maxLength={4000}
          returnKeyType="default"
          textAlign="right"
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            (!input.trim() || isSending) && styles.sendBtnDisabled,
          ]}
          onPress={handleSend}
          disabled={!input.trim() || isSending}
          activeOpacity={0.7}
        >
          {isSending ? (
            <ActivityIndicator size="small" color={COLORS.primaryBg} />
          ) : (
            <Feather name="send" size={18} color={COLORS.primaryBg} />
          )}
        </TouchableOpacity>
      </View>

      {/* ─── Auto-Start Modal ─── */}
      <AutoStartModal visible={showAutoStart} onClose={() => setShowAutoStart(false)} />

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.secondaryBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  backBtn: {
    padding: SPACING.xs,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: COLORS.textPrimary,
  },
  headerSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  iconBtn: {
    padding: SPACING.xs,
  },
  autoBtn: {
    backgroundColor: "#eab30818",
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: "#eab30833",
  },
  serverBar: {
    backgroundColor: COLORS.secondaryBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  urlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  urlText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    textAlign: "left",
  },
  versionBadge: {
    backgroundColor: COLORS.accent + "33",
    borderRadius: RADIUS.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  versionText: {
    fontSize: 10,
    color: COLORS.accent,
    fontWeight: "700" as const,
  },
  urlEditRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  urlInput: {
    flex: 1,
    height: 34,
    backgroundColor: COLORS.primaryBg,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.accent,
    paddingHorizontal: SPACING.sm,
    color: COLORS.textPrimary,
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    textAlign: "left",
  },
  saveBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
  },
  saveBtnText: {
    color: COLORS.primaryBg,
    fontWeight: "700" as const,
    fontSize: 13,
  },
  cancelBtn: {
    padding: SPACING.xs,
  },
  warningBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    backgroundColor: "#7f1d1d33",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: "#ef444433",
  },
  warningText: {
    flex: 1,
    fontSize: 11,
    color: "#ef4444",
    textAlign: "right",
  },
  retryText: {
    fontSize: 11,
    color: COLORS.accent,
    fontWeight: "700" as const,
  },
  connectedBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    backgroundColor: "#14532d22",
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    justifyContent: "center",
  },
  connectedText: {
    fontSize: 11,
    color: "#22c55e",
    fontWeight: "600" as const,
    flex: 1,
  },
  pingBadge: {
    backgroundColor: "#1e40af44",
    borderRadius: RADIUS.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "#3b82f633",
  },
  pingText: {
    fontSize: 10,
    color: "#60a5fa",
    fontWeight: "700" as const,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  pingBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.accent + "44",
    backgroundColor: COLORS.accent + "11",
  },
  pingBtnText: {
    fontSize: 11,
    color: COLORS.accent,
    fontWeight: "600" as const,
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    backgroundColor: "#eab30818",
    borderWidth: 1,
    borderColor: "#eab30833",
  },
  resetText: {
    fontSize: 10,
    color: "#eab308",
    fontWeight: "700" as const,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  aidenLogo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#1e40af",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
  },
  aidenLogoText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700" as const,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: COLORS.textPrimary,
  },
  emptyDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  quickChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
    justifyContent: "center",
    marginTop: SPACING.sm,
  },
  chip: {
    backgroundColor: COLORS.secondaryBg,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  chipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  messageList: {
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  typingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs,
  },
  typingText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontStyle: "italic",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    backgroundColor: COLORS.secondaryBg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  textInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    backgroundColor: COLORS.primaryBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.textPrimary,
    fontSize: 14,
    textAlignVertical: "center",
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    backgroundColor: COLORS.border,
  },
  attachBtn: {
    width: 36,
    height: 36,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderRadius: RADIUS.full,
    marginRight: SPACING.xs,
  },
});
