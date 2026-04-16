import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMemory } from "../../hooks/useMemory";
import { COLORS } from "../theme/colors";
import { SPACING, RADIUS } from "../theme/spacing";
import { TYPOGRAPHY } from "../theme/typography";
import { formatRelativeTime } from "../../utils/time";
import type { MemoryEntry, NoteEntry } from "../../types/memory.types";

type Tab = "entries" | "notes";

export function MemoryScreen() {
  const { entries, notes, isLoaded } = useMemory();
  const [tab, setTab] = useState<Tab>("entries");
  const [search, setSearch] = useState("");
  const insets = useSafeAreaInsets();

  const filteredEntries = entries.filter(
    (e) =>
      e.key.includes(search) ||
      e.value.includes(search) ||
      e.tags.some((t) => t.includes(search))
  );

  const filteredNotes = notes.filter(
    (n) => n.title.includes(search) || n.content.includes(search)
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <Feather name="search" size={16} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="ابحث في الذاكرة..."
          placeholderTextColor={COLORS.textMuted}
          textAlign="right"
        />
      </View>

      <View style={styles.tabs}>
        {(["entries", "notes"] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === "entries" ? `ذاكرة (${entries.length})` : `ملاحظات (${notes.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={{
          padding: SPACING.md,
          paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + SPACING.xl,
        }}
      >
        {!isLoaded && (
          <Text style={styles.empty}>جاري التحميل...</Text>
        )}

        {tab === "entries" && isLoaded && (
          filteredEntries.length === 0 ? (
            <EmptyState label="لا توجد معلومات محفوظة بعد" />
          ) : (
            filteredEntries.map((e) => <MemoryEntryCard key={e.id} entry={e} />)
          )
        )}

        {tab === "notes" && isLoaded && (
          filteredNotes.length === 0 ? (
            <EmptyState label="لا توجد ملاحظات بعد" />
          ) : (
            filteredNotes.map((n) => <NoteCard key={n.id} note={n} />)
          )
        )}
      </ScrollView>
    </View>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <View style={styles.emptyContainer}>
      <Feather name="inbox" size={40} color={COLORS.textMuted} />
      <Text style={styles.empty}>{label}</Text>
    </View>
  );
}

function MemoryEntryCard({ entry }: { entry: MemoryEntry }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardKey}>{entry.key}</Text>
        <Text style={styles.cardCategory}>{entry.category}</Text>
      </View>
      <Text style={styles.cardValue}>{entry.value}</Text>
      <Text style={styles.cardTime}>{formatRelativeTime(entry.updatedAt)}</Text>
    </View>
  );
}

function NoteCard({ note }: { note: NoteEntry }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardKey}>{note.title}</Text>
      <Text style={styles.cardValue} numberOfLines={3}>
        {note.content}
      </Text>
      <Text style={styles.cardTime}>{formatRelativeTime(note.updatedAt)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBg,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    margin: SPACING.md,
    backgroundColor: COLORS.surfaceBg,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: TYPOGRAPHY.md,
    color: COLORS.textPrimary,
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: "center",
    backgroundColor: COLORS.surfaceBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabActive: {
    backgroundColor: COLORS.accentGlow,
    borderColor: COLORS.accent,
  },
  tabText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.accent,
    fontWeight: "600" as const,
  },
  list: {
    flex: 1,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  cardKey: {
    fontSize: TYPOGRAPHY.md,
    color: COLORS.textPrimary,
    fontWeight: "600" as const,
    flex: 1,
    textAlign: "right",
  },
  cardCategory: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.accent,
    backgroundColor: COLORS.accentGlow,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  cardValue: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    textAlign: "right",
    lineHeight: TYPOGRAPHY.lineHeightMd,
  },
  cardTime: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
    textAlign: "left",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: SPACING.huge,
    gap: SPACING.md,
  },
  empty: {
    fontSize: TYPOGRAPHY.md,
    color: COLORS.textMuted,
    textAlign: "center",
  },
});
