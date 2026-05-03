// ============================================================
// Knowledge Vault — مخزن معرفة Aiden
// LESSONS.md · user-profile.json · تحرير الدروس
// ============================================================

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "../theme/colors";
import { SPACING, RADIUS } from "../theme/spacing";
import { STORAGE_KEYS } from "../../constants/storage-keys";
import { AIDEN_DEFAULT_URL } from "../../config/aiden.config";
import {
  fetchLessonsRaw,
  fetchUserProfile,
  parseLessons,
  updateLesson,
  deleteLesson,
  Lesson,
  UserProfile,
} from "../../services/knowledge.service";

type Tab = "lessons" | "profile" | "raw";

// ── Lesson card ──────────────────────────────────────────────

function LessonCard({
  lesson,
  onToggleApproval,
  onEdit,
  onDelete,
}: {
  lesson: Lesson;
  onToggleApproval: (id: string) => void;
  onEdit: (lesson: Lesson) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <View style={[lcStyles.card, !lesson.approved && lcStyles.cardUnapproved]}>
      <View style={lcStyles.top}>
        <View style={lcStyles.catBadge}>
          <Text style={lcStyles.catText}>{lesson.category ?? "عام"}</Text>
        </View>
        <View style={lcStyles.actions}>
          <TouchableOpacity onPress={() => onEdit(lesson)} style={lcStyles.iconBtn} activeOpacity={0.7}>
            <Feather name="edit-2" size={13} color={COLORS.accent} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onToggleApproval(lesson.id)} style={lcStyles.iconBtn} activeOpacity={0.7}>
            <Feather
              name={lesson.approved ? "check-circle" : "circle"}
              size={13}
              color={lesson.approved ? "#22c55e" : COLORS.textMuted}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(lesson.id)} style={lcStyles.iconBtn} activeOpacity={0.7}>
            <Feather name="trash-2" size={13} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={[lcStyles.content, !lesson.approved && lcStyles.contentUnapproved]}>
        {lesson.content}
      </Text>
      {!lesson.approved && (
        <Text style={lcStyles.pendingLabel}>⏸ معلّق — اضغط ✓ للموافقة</Text>
      )}
    </View>
  );
}

const lcStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.xs,
  },
  cardUnapproved: { borderColor: "#eab30844", backgroundColor: "#eab30808" },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  catBadge: {
    backgroundColor: COLORS.accent + "22",
    borderRadius: RADIUS.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  catText: { fontSize: 10, color: COLORS.accent, fontWeight: "700" as const },
  actions: { flexDirection: "row", gap: 2 },
  iconBtn: { padding: 4 },
  content: { fontSize: 13, color: COLORS.textPrimary, lineHeight: 20, textAlign: "right" },
  contentUnapproved: { color: COLORS.textSecondary },
  pendingLabel: { fontSize: 10, color: "#eab308", textAlign: "right" },
});

// ── Profile viewer ───────────────────────────────────────────

function ProfileViewer({ profile }: { profile: UserProfile }) {
  return (
    <View style={pvStyles.container}>
      {Object.entries(profile).map(([key, value]) => (
        <View key={key} style={pvStyles.row}>
          <Text style={pvStyles.key}>{key}</Text>
          <Text style={pvStyles.value} numberOfLines={3}>
            {typeof value === "string"
              ? value
              : Array.isArray(value)
              ? value.join("، ")
              : JSON.stringify(value)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const pvStyles = StyleSheet.create({
  container: { gap: SPACING.sm },
  row: {
    flexDirection: "row",
    gap: SPACING.md,
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  key: {
    fontSize: 11,
    color: COLORS.accent,
    fontWeight: "700" as const,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    width: 90,
    textAlign: "left",
  },
  value: { flex: 1, fontSize: 12, color: COLORS.textSecondary, textAlign: "right" },
});

// ── Edit Modal ───────────────────────────────────────────────

function EditModal({
  lesson,
  onSave,
  onCancel,
}: {
  lesson: Lesson;
  onSave: (updated: Lesson) => void;
  onCancel: () => void;
}) {
  const [content, setContent] = useState(lesson.content);
  return (
    <View style={emStyles.overlay}>
      <View style={emStyles.modal}>
        <Text style={emStyles.title}>تعديل الدرس</Text>
        <TextInput
          style={emStyles.input}
          value={content}
          onChangeText={setContent}
          multiline
          numberOfLines={5}
          textAlign="right"
          placeholderTextColor={COLORS.textMuted}
        />
        <View style={emStyles.buttons}>
          <TouchableOpacity style={emStyles.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
            <Text style={emStyles.cancelText}>إلغاء</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={emStyles.saveBtn}
            onPress={() => onSave({ ...lesson, content })}
            activeOpacity={0.7}
          >
            <Text style={emStyles.saveText}>حفظ</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const emStyles = StyleSheet.create({
  overlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
    padding: SPACING.xl,
  },
  modal: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    width: "100%",
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.accent + "44",
  },
  title: { fontSize: 16, color: COLORS.textPrimary, fontWeight: "700" as const, textAlign: "center" },
  input: {
    backgroundColor: COLORS.primaryBg,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: 13,
    minHeight: 120,
    borderWidth: 1,
    borderColor: COLORS.border,
    textAlignVertical: "top",
  },
  buttons: { flexDirection: "row", gap: SPACING.sm },
  cancelBtn: { flex: 1, backgroundColor: COLORS.surfaceBg, borderRadius: RADIUS.sm, padding: SPACING.md, alignItems: "center" },
  cancelText: { color: COLORS.textSecondary, fontWeight: "600" as const },
  saveBtn: { flex: 1, backgroundColor: COLORS.accent, borderRadius: RADIUS.sm, padding: SPACING.md, alignItems: "center" },
  saveText: { color: COLORS.primaryBg, fontWeight: "700" as const },
});

// ── Main Screen ──────────────────────────────────────────────

export function KnowledgeVault() {
  const insets = useSafeAreaInsets();
  const [serverUrl, setServerUrl] = useState(AIDEN_DEFAULT_URL);
  const [tab, setTab] = useState<Tab>("lessons");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [rawLessons, setRawLessons] = useState("");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [rawProfile, setRawProfile] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.AIDEN_SERVER_URL).then((v) => {
      if (v) setServerUrl(v);
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [raw, { profile: prof, raw: rawProf }] = await Promise.all([
        fetchLessonsRaw(serverUrl),
        fetchUserProfile(serverUrl),
      ]);
      setRawLessons(raw);
      setLessons(parseLessons(raw));
      setProfile(prof);
      setRawProfile(rawProf);
    } finally {
      setLoading(false);
    }
  }, [serverUrl]);

  useEffect(() => { load(); }, [load]);

  const handleToggleApproval = useCallback((id: string) => {
    setLessons((prev) =>
      prev.map((l) => (l.id === id ? { ...l, approved: !l.approved } : l))
    );
  }, []);

  const handleSaveEdit = useCallback(async (updated: Lesson) => {
    setLessons((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    setEditingLesson(null);
    await updateLesson(serverUrl, updated);
  }, [serverUrl]);

  const handleDelete = useCallback((id: string) => {
    Alert.alert("حذف الدرس", "هل تريد حذف هذا الدرس نهائياً؟", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "حذف",
        style: "destructive",
        onPress: async () => {
          setLessons((prev) => prev.filter((l) => l.id !== id));
          await deleteLesson(serverUrl, id);
        },
      },
    ]);
  }, [serverUrl]);

  const filteredLessons = lessons.filter(
    (l) => !search || l.content.includes(search) || (l.category ?? "").includes(search)
  );

  const approvedCount = lessons.filter((l) => l.approved).length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient colors={["#0F1829", "#0B0F1A"]} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="arrow-right" size={22} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Knowledge Vault</Text>
          <Text style={styles.headerSub}>{approvedCount}/{lessons.length} دروس موافق عليها</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={load} disabled={loading} activeOpacity={0.7}>
          {loading
            ? <ActivityIndicator size="small" color={COLORS.accent} />
            : <Feather name="refresh-cw" size={18} color={COLORS.accent} />
          }
        </TouchableOpacity>
      </LinearGradient>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{lessons.length}</Text>
          <Text style={styles.statLabel}>دروس مكتسبة</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: "#22c55e" }]}>{approvedCount}</Text>
          <Text style={styles.statLabel}>موافق عليها</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: "#eab308" }]}>{lessons.length - approvedCount}</Text>
          <Text style={styles.statLabel}>معلّقة</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(["lessons", "profile", "raw"] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
            activeOpacity={0.7}
          >
            <Feather
              name={t === "lessons" ? "book" : t === "profile" ? "user" : "code"}
              size={12}
              color={tab === t ? COLORS.accent : COLORS.textMuted}
            />
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === "lessons" ? "الدروس" : t === "profile" ? "الملف الشخصي" : "Raw"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search */}
      {tab === "lessons" && (
        <View style={styles.searchRow}>
          <Feather name="search" size={14} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="ابحث في الدروس..."
            placeholderTextColor={COLORS.textMuted}
            textAlign="right"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={14} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={COLORS.accent} />}
      >
        {tab === "lessons" && (
          <>
            {filteredLessons.length === 0 && !loading && (
              <View style={styles.empty}>
                <Feather name="book-open" size={36} color={COLORS.textMuted} />
                <Text style={styles.emptyText}>
                  {lessons.length === 0
                    ? "لم يتعلم Aiden دروساً بعد، أو السيرفر غير متصل"
                    : "لا نتائج للبحث"}
                </Text>
              </View>
            )}
            {filteredLessons.map((lesson) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                onToggleApproval={handleToggleApproval}
                onEdit={setEditingLesson}
                onDelete={handleDelete}
              />
            ))}
          </>
        )}

        {tab === "profile" && (
          <>
            {profile ? (
              <ProfileViewer profile={profile} />
            ) : (
              <View style={styles.empty}>
                <Feather name="user" size={36} color={COLORS.textMuted} />
                <Text style={styles.emptyText}>
                  {loading ? "جاري التحميل..." : "لم يُعثر على ملف المستخدم، أو السيرفر غير متصل"}
                </Text>
              </View>
            )}
          </>
        )}

        {tab === "raw" && (
          <ScrollView horizontal showsHorizontalScrollIndicator>
            <View style={styles.rawContainer}>
              <Text style={styles.rawTitle}>📄 LESSONS.md</Text>
              <Text style={styles.rawText}>{rawLessons || "— فارغ —"}</Text>
              <Text style={[styles.rawTitle, { marginTop: SPACING.xl }]}>👤 user-profile.json</Text>
              <Text style={styles.rawText}>{rawProfile || "— فارغ —"}</Text>
            </View>
          </ScrollView>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit modal */}
      {editingLesson && (
        <EditModal
          lesson={editingLesson}
          onSave={handleSaveEdit}
          onCancel={() => setEditingLesson(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primaryBg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  backBtn: { padding: SPACING.xs },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 15, fontWeight: "700" as const, color: COLORS.textPrimary },
  headerSub: { fontSize: 10, color: COLORS.textMuted, marginTop: 1 },
  refreshBtn: { padding: SPACING.xs },
  statsBar: {
    flexDirection: "row",
    backgroundColor: COLORS.cardBg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statItem: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 22, fontWeight: "800" as const, color: COLORS.textPrimary },
  statLabel: { fontSize: 10, color: COLORS.textMuted },
  statDivider: { width: 1, backgroundColor: COLORS.border },
  tabs: {
    flexDirection: "row",
    backgroundColor: COLORS.secondaryBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.md,
    gap: 4,
  },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.accent },
  tabText: { fontSize: 12, color: COLORS.textMuted },
  tabTextActive: { color: COLORS.accent, fontWeight: "600" as const },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.secondaryBg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchInput: { flex: 1, fontSize: 13, color: COLORS.textPrimary },
  scroll: { flex: 1 },
  content: { padding: SPACING.md },
  empty: { alignItems: "center", gap: SPACING.md, padding: SPACING.huge },
  emptyText: { fontSize: 13, color: COLORS.textMuted, textAlign: "center" },
  rawContainer: { gap: SPACING.md },
  rawTitle: { fontSize: 12, color: COLORS.accent, fontWeight: "700" as const, marginBottom: SPACING.xs },
  rawText: {
    fontSize: 11,
    color: "#4ade80",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    lineHeight: 18,
    backgroundColor: "#0a0f0a",
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
    minWidth: 300,
  },
});
