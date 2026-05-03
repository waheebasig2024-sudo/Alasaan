import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  Platform,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "../theme/colors";
import { SPACING, RADIUS } from "../theme/spacing";
import { TYPOGRAPHY } from "../theme/typography";
import { useNetworkStatus } from "../../hooks/useNetworkStatus";
import { useChatStore } from "../../store/chat.store";
import { scheduleReminderInMinutes } from "../../services/notifications.service";
import { searchContacts } from "../../services/contacts.service";

const TASKS_KEY = "@offline_tasks";

interface OfflineTask {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
}

const OFFLINE_FEATURES = [
  { icon: "phone", label: "الاتصال", desc: "اتصل بجهات الاتصال", offline: true },
  { icon: "users", label: "جهات الاتصال", desc: "تصفح وابحث", offline: true },
  { icon: "bell", label: "التذكيرات", desc: "اضبط تذكيراً محلياً", offline: true },
  { icon: "clock", label: "الساعة والتاريخ", desc: "الوقت المحلي", offline: true },
  { icon: "check-square", label: "المهام", desc: "قائمة عمل محلية", offline: true },
  { icon: "calendar", label: "التقويم", desc: "عرض الأحداث", offline: true },
  { icon: "message-square", label: "المحادثات المخبأة", desc: "آخر محادثاتك", offline: true },
  { icon: "mic", label: "النسخ الصوتي", desc: "يحتاج انترنت (Groq)", offline: false },
  { icon: "cpu", label: "الذكاء الاصطناعي", desc: "يحتاج انترنت", offline: false },
  { icon: "search", label: "البحث على الويب", desc: "يحتاج انترنت", offline: false },
];

const QUICK_COMMANDS = [
  { icon: "phone", label: "اتصال سريع", color: "#4CAF75" },
  { icon: "bell", label: "تذكير الآن", color: "#D4A853" },
  { icon: "clock", label: "الوقت والتاريخ", color: "#5B9BD5" },
  { icon: "edit-3", label: "ملاحظة جديدة", color: "#E0925C" },
  { icon: "users", label: "جهات الاتصال", color: "#9C5CE0" },
  { icon: "calendar", label: "التقويم", color: "#E05C8E" },
];

export default function OfflineScreen() {
  const insets = useSafeAreaInsets();
  const { isOnline } = useNetworkStatus();
  const { messages } = useChatStore();

  const [tasks, setTasks] = useState<OfflineTask[]>([]);
  const [newTask, setNewTask] = useState("");
  const [now, setNow] = useState(new Date());
  const [activeTab, setActiveTab] = useState<"tools" | "tasks" | "cache">("tools");

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const raw = await AsyncStorage.getItem(TASKS_KEY);
      if (raw) setTasks(JSON.parse(raw));
    } catch {}
  };

  const saveTasks = async (updated: OfflineTask[]) => {
    try {
      await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(updated));
    } catch {}
  };

  const addTask = useCallback(() => {
    if (!newTask.trim()) return;
    const task: OfflineTask = {
      id: Date.now().toString(),
      text: newTask.trim(),
      done: false,
      createdAt: Date.now(),
    };
    const updated = [task, ...tasks];
    setTasks(updated);
    saveTasks(updated);
    setNewTask("");
  }, [newTask, tasks]);

  const toggleTask = useCallback((id: string) => {
    const updated = tasks.map((t) =>
      t.id === id ? { ...t, done: !t.done } : t
    );
    setTasks(updated);
    saveTasks(updated);
  }, [tasks]);

  const deleteTask = useCallback((id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    setTasks(updated);
    saveTasks(updated);
  }, [tasks]);

  const handleQuickCommand = useCallback(async (label: string) => {
    if (label === "الوقت والتاريخ") {
      const d = new Date();
      const time = d.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
      const date = d.toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
      Alert.alert("الوقت والتاريخ", `⏰ ${time}\n📅 ${date}`);
      return;
    }
    if (label === "اتصال سريع") {
      Alert.prompt(
        "اتصال سريع",
        "أدخل رقم الهاتف أو اسم جهة الاتصال",
        async (input) => {
          if (!input) return;
          if (/^\+?[\d\s\-]+$/.test(input.trim())) {
            await Linking.openURL(`tel:${input.trim().replace(/\s/g, "")}`);
          } else {
            const results = await searchContacts(input);
            if (results.length > 0 && results[0].phoneNumber) {
              await Linking.openURL(`tel:${results[0].phoneNumber}`);
            } else {
              Alert.alert("تنبيه", "لم أجد جهة اتصال بهذا الاسم");
            }
          }
        },
        "plain-text",
        "",
        "phone-pad"
      );
      return;
    }
    if (label === "تذكير الآن") {
      Alert.prompt(
        "تذكير جديد",
        "أدخل نص التذكير ثم عدد الدقائق (مثال: اجتماع|30)",
        async (input) => {
          if (!input) return;
          const parts = input.split("|");
          const text = parts[0].trim();
          const mins = parseInt(parts[1]?.trim() ?? "5", 10) || 5;
          await scheduleReminderInMinutes("تذكير من الحسن", text, mins);
          Alert.alert("✅ تم", `سيُذكّرك الحسن بـ "${text}" بعد ${mins} دقيقة`);
        },
        "plain-text",
        "مهمتي|10"
      );
      return;
    }
    if (label === "جهات الاتصال") {
      await Linking.openURL("content://contacts");
      return;
    }
    if (label === "التقويم") {
      const scheme =
        Platform.OS === "android"
          ? "content://com.android.calendar/time/"
          : "calshow://";
      const canOpen = await Linking.canOpenURL(scheme);
      if (canOpen) await Linking.openURL(scheme);
      else Alert.alert("تنبيه", "لا يمكن فتح التقويم مباشرة");
      return;
    }
    if (label === "ملاحظة جديدة") {
      setActiveTab("tasks");
    }
  }, []);

  const cachedMessages = messages
    .filter((m) => m.role === "assistant" && m.content.trim())
    .slice(-10)
    .reverse();

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString("ar-SA", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Feather name="arrow-right" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>العمل بدون انترنت</Text>
          <Text style={styles.headerSub}>مستوحى من مشروع Aiden</Text>
        </View>
        <View style={[styles.statusDot, { backgroundColor: isOnline ? COLORS.success : COLORS.error }]} />
      </View>

      {/* ── Connection Banner ── */}
      <View
        style={[
          styles.banner,
          { backgroundColor: isOnline ? "rgba(76,175,125,0.12)" : "rgba(224,92,92,0.12)" },
        ]}
      >
        <Feather
          name={isOnline ? "wifi" : "wifi-off"}
          size={16}
          color={isOnline ? COLORS.success : COLORS.error}
        />
        <Text
          style={[
            styles.bannerText,
            { color: isOnline ? COLORS.success : COLORS.error },
          ]}
        >
          {isOnline
            ? "متصل بالانترنت — جميع الميزات متاحة"
            : "غير متصل — وضع العمل المحلي مفعّل"}
        </Text>
      </View>

      {/* ── Clock ── */}
      <View style={styles.clock}>
        <Text style={styles.clockTime}>
          {now.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </Text>
        <Text style={styles.clockDate}>
          {now.toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </Text>
      </View>

      {/* ── Tabs ── */}
      <View style={styles.tabs}>
        {(["tools", "tasks", "cache"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === "tools" ? "الأدوات" : tab === "tasks" ? "المهام" : "المحادثات"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Content ── */}
      {activeTab === "tools" && (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Quick Commands */}
          <Text style={styles.sectionTitle}>أوامر سريعة بدون AI</Text>
          <View style={styles.quickGrid}>
            {QUICK_COMMANDS.map((cmd) => (
              <TouchableOpacity
                key={cmd.label}
                style={[styles.quickCard, { borderColor: cmd.color + "55" }]}
                onPress={() => handleQuickCommand(cmd.label)}
                activeOpacity={0.75}
              >
                <View style={[styles.quickIcon, { backgroundColor: cmd.color + "22" }]}>
                  <Feather name={cmd.icon as any} size={22} color={cmd.color} />
                </View>
                <Text style={styles.quickLabel}>{cmd.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Feature List */}
          <Text style={styles.sectionTitle}>ما يعمل بدون انترنت</Text>
          {OFFLINE_FEATURES.map((f) => (
            <View key={f.label} style={styles.featureRow}>
              <View
                style={[
                  styles.featureIconBox,
                  { backgroundColor: f.offline ? "rgba(76,175,125,0.12)" : "rgba(224,92,92,0.08)" },
                ]}
              >
                <Feather
                  name={f.icon as any}
                  size={16}
                  color={f.offline ? COLORS.success : COLORS.error}
                />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureLabel}>{f.label}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
              <Feather
                name={f.offline ? "check-circle" : "x-circle"}
                size={16}
                color={f.offline ? COLORS.success : COLORS.error}
              />
            </View>
          ))}

          {/* Aiden inspiration note */}
          <View style={styles.aidenNote}>
            <Feather name="info" size={14} color={COLORS.textMuted} />
            <Text style={styles.aidenNoteText}>
              هذه الشاشة مستوحاة من مشروع Aiden — نظام AI محلي يعمل على الحاسوب باستخدام Ollama.
              على الهاتف نوفر الميزات التي تعمل حقاً بدون انترنت.
            </Text>
          </View>
          <View style={{ height: SPACING.massive }} />
        </ScrollView>
      )}

      {activeTab === "tasks" && (
        <View style={styles.tasksContainer}>
          <View style={styles.taskInput}>
            <TextInput
              style={styles.taskField}
              placeholder="أضف مهمة جديدة..."
              placeholderTextColor={COLORS.textMuted}
              value={newTask}
              onChangeText={setNewTask}
              onSubmitEditing={addTask}
              returnKeyType="done"
              textAlign="right"
            />
            <TouchableOpacity
              style={styles.taskAddBtn}
              onPress={addTask}
              activeOpacity={0.7}
            >
              <Feather name="plus" size={20} color={COLORS.primaryBg} />
            </TouchableOpacity>
          </View>

          {tasks.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="check-square" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>لا توجد مهام بعد</Text>
              <Text style={styles.emptySubText}>أضف مهامك أعلاه — تُحفظ على جهازك</Text>
            </View>
          ) : (
            <FlatList
              data={tasks}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: SPACING.massive }}
              renderItem={({ item }) => (
                <View style={styles.taskRow}>
                  <TouchableOpacity
                    onPress={() => toggleTask(item.id)}
                    activeOpacity={0.7}
                    style={styles.taskCheck}
                  >
                    <Feather
                      name={item.done ? "check-circle" : "circle"}
                      size={22}
                      color={item.done ? COLORS.success : COLORS.textMuted}
                    />
                  </TouchableOpacity>
                  <View style={styles.taskTextWrap}>
                    <Text
                      style={[styles.taskText, item.done && styles.taskTextDone]}
                    >
                      {item.text}
                    </Text>
                    <Text style={styles.taskTime}>{formatTime(item.createdAt)}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => deleteTask(item.id)}
                    activeOpacity={0.7}
                  >
                    <Feather name="trash-2" size={16} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
        </View>
      )}

      {activeTab === "cache" && (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {cachedMessages.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="message-square" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>لا توجد محادثات مخبأة</Text>
              <Text style={styles.emptySubText}>
                تحدّث مع الحسن أولاً — ستظهر ردوده هنا للمراجعة بدون انترنت
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>
                آخر {cachedMessages.length} رد من الحسن
              </Text>
              {cachedMessages.map((msg) => (
                <View key={msg.id} style={styles.cacheCard}>
                  <View style={styles.cacheHeader}>
                    <Feather name="cpu" size={12} color={COLORS.accent} />
                    <Text style={styles.cacheTime}>
                      {msg.timestamp
                        ? new Date(msg.timestamp).toLocaleTimeString("ar-SA", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </Text>
                  </View>
                  <Text style={styles.cacheText} numberOfLines={6}>
                    {msg.content}
                  </Text>
                </View>
              ))}
              <View style={{ height: SPACING.massive }} />
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primaryBg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.secondaryBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { padding: SPACING.xs, marginRight: SPACING.sm },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontFamily: "Inter_700Bold",
    color: COLORS.accent,
    textAlign: "center",
  },
  headerSub: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginLeft: SPACING.sm },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  bannerText: { fontSize: TYPOGRAPHY.sm, fontFamily: "Inter_500Medium" },
  clock: {
    alignItems: "center",
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  clockTime: {
    fontSize: TYPOGRAPHY.xxxl,
    fontFamily: "Inter_700Bold",
    color: COLORS.accent,
    letterSpacing: 2,
  },
  clockDate: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    fontFamily: "Inter_400Regular",
    marginTop: SPACING.xs,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: COLORS.secondaryBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: { flex: 1, paddingVertical: SPACING.md, alignItems: "center" },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.accent },
  tabText: { fontSize: TYPOGRAPHY.sm, color: COLORS.textMuted, fontFamily: "Inter_500Medium" },
  tabTextActive: { color: COLORS.accent },
  scroll: { flex: 1, paddingHorizontal: SPACING.lg },
  sectionTitle: {
    fontSize: TYPOGRAPHY.md,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.textSecondary,
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
    textAlign: "right",
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  quickCard: {
    width: "30%",
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    alignItems: "center",
    gap: SPACING.sm,
  },
  quickIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  quickLabel: { fontSize: TYPOGRAPHY.xs, color: COLORS.textPrimary, fontFamily: "Inter_500Medium", textAlign: "center" },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },
  featureIconBox: { width: 32, height: 32, borderRadius: RADIUS.sm, alignItems: "center", justifyContent: "center" },
  featureText: { flex: 1, alignItems: "flex-end" },
  featureLabel: { fontSize: TYPOGRAPHY.sm, fontFamily: "Inter_600SemiBold", color: COLORS.textPrimary },
  featureDesc: { fontSize: TYPOGRAPHY.xs, color: COLORS.textMuted, fontFamily: "Inter_400Regular" },
  aidenNote: {
    flexDirection: "row",
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginTop: SPACING.xl,
    gap: SPACING.sm,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  aidenNoteText: {
    flex: 1,
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
    fontFamily: "Inter_400Regular",
    lineHeight: TYPOGRAPHY.lineHeightSm,
    textAlign: "right",
  },
  tasksContainer: { flex: 1, paddingHorizontal: SPACING.lg },
  taskInput: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  taskField: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.textPrimary,
    fontFamily: "Inter_400Regular",
    fontSize: TYPOGRAPHY.md,
  },
  taskAddBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.md,
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  taskCheck: { padding: SPACING.xs },
  taskTextWrap: { flex: 1, alignItems: "flex-end" },
  taskText: { fontSize: TYPOGRAPHY.md, color: COLORS.textPrimary, fontFamily: "Inter_500Medium", textAlign: "right" },
  taskTextDone: { textDecorationLine: "line-through", color: COLORS.textMuted },
  taskTime: { fontSize: TYPOGRAPHY.xs, color: COLORS.textMuted, marginTop: 2 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: SPACING.massive },
  emptyText: { fontSize: TYPOGRAPHY.lg, color: COLORS.textSecondary, fontFamily: "Inter_600SemiBold", marginTop: SPACING.lg },
  emptySubText: { fontSize: TYPOGRAPHY.sm, color: COLORS.textMuted, textAlign: "center", marginTop: SPACING.sm, lineHeight: 20 },
  cacheCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cacheHeader: { flexDirection: "row", alignItems: "center", gap: SPACING.xs, marginBottom: SPACING.sm },
  cacheTime: { fontSize: TYPOGRAPHY.xs, color: COLORS.textMuted, fontFamily: "Inter_400Regular" },
  cacheText: { fontSize: TYPOGRAPHY.sm, color: COLORS.textPrimary, fontFamily: "Inter_400Regular", lineHeight: 20, textAlign: "right" },
});
