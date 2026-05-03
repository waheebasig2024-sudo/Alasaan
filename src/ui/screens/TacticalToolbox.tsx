// ============================================================
// Tactical Toolbox — صندوق أدوات Aiden الـ 62 مهارة
// Terminal output · streaming · Dark Tech UI
// ============================================================

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Animated,
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
  AIDEN_SKILLS,
  SKILL_CATEGORY_LABELS,
  SKILL_CATEGORY_COLORS,
  SkillCategory,
  AidenSkill,
  SkillResult,
  runSkill,
} from "../../services/tactical.service";

// ── Terminal view ────────────────────────────────────────────

function TerminalView({
  output,
  skill,
  result,
  onClose,
}: {
  output: string;
  skill: AidenSkill | null;
  result: SkillResult | null;
  onClose: () => void;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const cursor = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(cursor, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(cursor, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    if (!result) blink.start();
    else { blink.stop(); cursor.setValue(1); }
    return () => blink.stop();
  }, [result, cursor]);

  return (
    <View style={tvStyles.container}>
      {/* Terminal header */}
      <View style={tvStyles.header}>
        <View style={tvStyles.dots}>
          <View style={[tvStyles.dot, { backgroundColor: "#ef4444" }]} />
          <View style={[tvStyles.dot, { backgroundColor: "#eab308" }]} />
          <View style={[tvStyles.dot, { backgroundColor: "#22c55e" }]} />
        </View>
        <Text style={tvStyles.title}>
          {skill ? `aiden@kali:~$ ${skill.id}` : "aiden@kali:~$"}
        </Text>
        <TouchableOpacity onPress={onClose} style={tvStyles.closeBtn} activeOpacity={0.7}>
          <Feather name="x" size={14} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Terminal body */}
      <ScrollView
        ref={scrollRef}
        style={tvStyles.body}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
      >
        <Text style={tvStyles.prompt}>
          {skill ? `$ aiden run --skill "${skill.id}" --session tactical\n` : ""}
        </Text>
        <Text style={tvStyles.output}>{output}</Text>
        {!result && (
          <Animated.Text style={[tvStyles.cursor, { opacity: cursor }]}>▌</Animated.Text>
        )}
        {result && (
          <Text style={[tvStyles.exitCode, { color: result.exitCode === 0 ? "#22c55e" : "#ef4444" }]}>
            {"\n"}[Process exited with code {result.exitCode ?? 0}] — {result.duration}ms
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const tvStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0e1a",
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1E2A40",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#141928",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#1E2A40",
  },
  dots: { flexDirection: "row", gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  title: {
    flex: 1,
    fontSize: 11,
    color: "#4ade80",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    textAlign: "center",
  },
  closeBtn: { padding: 2 },
  body: { flex: 1, padding: SPACING.md },
  prompt: {
    fontSize: 12,
    color: "#4ade80",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  output: {
    fontSize: 12,
    color: "#e2e8f0",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    lineHeight: 20,
  },
  cursor: {
    fontSize: 14,
    color: "#4ade80",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  exitCode: {
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
});

// ── Skill card ───────────────────────────────────────────────

function SkillCard({
  skill,
  onRun,
  running,
}: {
  skill: AidenSkill;
  onRun: (skill: AidenSkill) => void;
  running: boolean;
}) {
  const catColor = SKILL_CATEGORY_COLORS[skill.category];

  return (
    <TouchableOpacity
      style={[scStyles.card, running && scStyles.cardRunning, skill.dangerous && scStyles.cardDangerous]}
      onPress={() => onRun(skill)}
      disabled={running}
      activeOpacity={0.7}
    >
      <View style={[scStyles.iconWrap, { backgroundColor: catColor + "22" }]}>
        <Feather name={skill.icon as any} size={16} color={running ? COLORS.accent : catColor} />
      </View>
      <View style={scStyles.info}>
        <Text style={scStyles.name} numberOfLines={1}>{skill.name}</Text>
        <Text style={scStyles.desc} numberOfLines={1}>{skill.description}</Text>
      </View>
      {running
        ? <ActivityIndicator size="small" color={COLORS.accent} />
        : skill.dangerous
        ? <Feather name="alert-triangle" size={12} color="#ef4444" />
        : <Feather name="play" size={12} color={catColor} />
      }
    </TouchableOpacity>
  );
}

const scStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardRunning: { borderColor: COLORS.accent + "66", backgroundColor: COLORS.accent + "08" },
  cardDangerous: { borderColor: "#ef444433" },
  iconWrap: { width: 36, height: 36, borderRadius: RADIUS.sm, alignItems: "center", justifyContent: "center" },
  info: { flex: 1 },
  name: { fontSize: 13, color: COLORS.textPrimary, fontWeight: "600" as const },
  desc: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
});

// ── Param input dialog ───────────────────────────────────────

function ParamDialog({
  skill,
  onConfirm,
  onCancel,
}: {
  skill: AidenSkill;
  onConfirm: (params: Record<string, string>) => void;
  onCancel: () => void;
}) {
  const [target, setTarget] = useState("");
  const [extra, setExtra] = useState("");

  return (
    <View style={pdStyles.overlay}>
      <View style={pdStyles.modal}>
        <View style={pdStyles.header}>
          <Feather name={skill.icon as any} size={20} color={SKILL_CATEGORY_COLORS[skill.category]} />
          <Text style={pdStyles.title}>{skill.name}</Text>
        </View>
        <Text style={pdStyles.desc}>{skill.description}</Text>
        {skill.dangerous && (
          <View style={pdStyles.warning}>
            <Feather name="alert-triangle" size={13} color="#ef4444" />
            <Text style={pdStyles.warningText}>⚠ مهارة حساسة — تأكد من الهدف قبل التنفيذ</Text>
          </View>
        )}
        <TextInput
          style={pdStyles.input}
          value={target}
          onChangeText={setTarget}
          placeholder="الهدف (IP / Domain / الملف...)"
          placeholderTextColor={COLORS.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          textAlign="right"
        />
        <TextInput
          style={pdStyles.input}
          value={extra}
          onChangeText={setExtra}
          placeholder="معاملات إضافية (اختياري)"
          placeholderTextColor={COLORS.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          textAlign="right"
        />
        <View style={pdStyles.buttons}>
          <TouchableOpacity style={pdStyles.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
            <Text style={pdStyles.cancelText}>إلغاء</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[pdStyles.runBtn, skill.dangerous && pdStyles.runBtnDangerous]}
            onPress={() => onConfirm({ target, extra })}
            activeOpacity={0.7}
          >
            <Feather name="play" size={14} color="#fff" />
            <Text style={pdStyles.runText}>تشغيل</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const pdStyles = StyleSheet.create({
  overlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.85)",
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
    borderColor: "#1E2A40",
  },
  header: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  title: { fontSize: 16, color: COLORS.textPrimary, fontWeight: "700" as const },
  desc: { fontSize: 12, color: COLORS.textSecondary, textAlign: "right" },
  warning: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: "#ef444411",
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
  },
  warningText: { flex: 1, fontSize: 11, color: "#ef4444", textAlign: "right" },
  input: {
    backgroundColor: COLORS.primaryBg,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    textAlign: "right",
  },
  buttons: { flexDirection: "row", gap: SPACING.sm },
  cancelBtn: { flex: 1, backgroundColor: COLORS.surfaceBg, borderRadius: RADIUS.sm, padding: SPACING.md, alignItems: "center" },
  cancelText: { color: COLORS.textSecondary, fontWeight: "600" as const },
  runBtn: { flex: 1, backgroundColor: "#3b82f6", borderRadius: RADIUS.sm, padding: SPACING.md, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  runBtnDangerous: { backgroundColor: "#ef4444" },
  runText: { color: "#fff", fontWeight: "700" as const },
});

// ── Main Screen ──────────────────────────────────────────────

const ALL_CATEGORIES = Object.keys(SKILL_CATEGORY_LABELS) as SkillCategory[];

export function TacticalToolbox() {
  const insets = useSafeAreaInsets();
  const [serverUrl, setServerUrl] = useState(AIDEN_DEFAULT_URL);
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [activeSkill, setActiveSkill] = useState<AidenSkill | null>(null);
  const [pendingSkill, setPendingSkill] = useState<AidenSkill | null>(null);
  const [terminalOutput, setTerminalOutput] = useState("");
  const [skillResult, setSkillResult] = useState<SkillResult | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [showTerminal, setShowTerminal] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.AIDEN_SERVER_URL).then((v) => {
      if (v) setServerUrl(v);
    });
  }, []);

  const filteredSkills = AIDEN_SKILLS.filter((s) => {
    const catMatch = selectedCategory === "all" || s.category === selectedCategory;
    const searchMatch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.description.includes(search);
    return catMatch && searchMatch;
  });

  const handleRunSkill = useCallback((skill: AidenSkill) => {
    setPendingSkill(skill);
  }, []);

  const handleConfirmRun = useCallback(async (params: Record<string, string>) => {
    const skill = pendingSkill;
    if (!skill) return;
    setPendingSkill(null);
    setActiveSkill(skill);
    setTerminalOutput("");
    setSkillResult(null);
    setRunningId(skill.id);
    setShowTerminal(true);

    await runSkill(
      serverUrl,
      skill,
      params,
      (line) => setTerminalOutput((prev) => prev + line),
      (result) => {
        setSkillResult(result);
        setRunningId(null);
      }
    );
  }, [pendingSkill, serverUrl]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient colors={["#0F1829", "#0B0F1A"]} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="arrow-right" size={22} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Tactical Toolbox</Text>
          <Text style={styles.headerSub}>{AIDEN_SKILLS.length} مهارة · Aiden v3.18.0</Text>
        </View>
        {showTerminal && (
          <TouchableOpacity style={styles.terminalToggle} onPress={() => setShowTerminal(false)} activeOpacity={0.7}>
            <Feather name="grid" size={18} color={COLORS.accent} />
          </TouchableOpacity>
        )}
      </LinearGradient>

      {/* Search */}
      <View style={styles.searchRow}>
        <Feather name="search" size={14} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="ابحث في المهارات..."
          placeholderTextColor={COLORS.textMuted}
          textAlign="right"
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Feather name="x" size={14} color={COLORS.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.catScroll}
        contentContainerStyle={styles.catContent}
      >
        <TouchableOpacity
          style={[styles.catChip, selectedCategory === "all" && styles.catChipActive]}
          onPress={() => setSelectedCategory("all")}
          activeOpacity={0.7}
        >
          <Text style={[styles.catChipText, selectedCategory === "all" && styles.catChipTextActive]}>
            الكل ({AIDEN_SKILLS.length})
          </Text>
        </TouchableOpacity>
        {ALL_CATEGORIES.map((cat) => {
          const count = AIDEN_SKILLS.filter((s) => s.category === cat).length;
          const color = SKILL_CATEGORY_COLORS[cat];
          const isActive = selectedCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.catChip, isActive && { backgroundColor: color + "22", borderColor: color + "66" }]}
              onPress={() => setSelectedCategory(cat)}
              activeOpacity={0.7}
            >
              <Text style={[styles.catChipText, isActive && { color }]}>
                {SKILL_CATEGORY_LABELS[cat]} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Content area */}
      {showTerminal ? (
        <View style={styles.terminalArea}>
          <TerminalView
            output={terminalOutput}
            skill={activeSkill}
            result={skillResult}
            onClose={() => setShowTerminal(false)}
          />
          {runningId && (
            <View style={styles.runningBar}>
              <ActivityIndicator size="small" color={COLORS.accent} />
              <Text style={styles.runningText}>Aiden يُنفّذ: {activeSkill?.name}...</Text>
              <View style={styles.runningDot} />
              <Text style={styles.runningText}>Kali Linux · Port 4200</Text>
            </View>
          )}
          {skillResult && (
            <TouchableOpacity
              style={styles.newRunBtn}
              onPress={() => setShowTerminal(false)}
              activeOpacity={0.7}
            >
              <Feather name="grid" size={14} color={COLORS.primaryBg} />
              <Text style={styles.newRunText}>تشغيل مهارة أخرى</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {filteredSkills.length === 0 && (
            <View style={styles.empty}>
              <Feather name="tool" size={36} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>لا مهارات مطابقة للبحث</Text>
            </View>
          )}
          {filteredSkills.map((skill) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              onRun={handleRunSkill}
              running={runningId === skill.id}
            />
          ))}
          <View style={{ height: 80 }} />
        </ScrollView>
      )}

      {/* Param dialog */}
      {pendingSkill && (
        <ParamDialog
          skill={pendingSkill}
          onConfirm={handleConfirmRun}
          onCancel={() => setPendingSkill(null)}
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
  terminalToggle: { padding: SPACING.xs },
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
  catScroll: { maxHeight: 44, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  catContent: { paddingHorizontal: SPACING.md, alignItems: "center", gap: SPACING.sm, paddingVertical: 6 },
  catChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
  },
  catChipActive: { backgroundColor: COLORS.accent + "22", borderColor: COLORS.accent + "66" },
  catChipText: { fontSize: 11, color: COLORS.textMuted, fontWeight: "600" as const },
  catChipTextActive: { color: COLORS.accent },
  scroll: { flex: 1 },
  content: { padding: SPACING.md, gap: SPACING.sm },
  terminalArea: { flex: 1, padding: SPACING.md, gap: SPACING.sm },
  runningBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.accent + "33",
  },
  runningText: { fontSize: 11, color: COLORS.textSecondary },
  runningDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.textMuted },
  newRunBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  newRunText: { color: COLORS.primaryBg, fontWeight: "700" as const, fontSize: 14 },
  empty: { alignItems: "center", gap: SPACING.md, padding: SPACING.huge },
  emptyText: { fontSize: 13, color: COLORS.textMuted, textAlign: "center" },
});
