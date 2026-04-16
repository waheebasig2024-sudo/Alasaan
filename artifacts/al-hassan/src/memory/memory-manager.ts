import type { MemoryEntry, MemoryCategory } from "../types/memory.types";
import { generateId } from "../utils/text";
import { now } from "../utils/time";
import { loadMemoryEntries, saveMemoryEntries } from "./schemas";
import { normalizeArabic } from "../utils/text";

const MAX_ENTRIES = 500;

export async function remember(
  key: string,
  value: string,
  category: MemoryCategory = "personal",
  tags: string[] = []
): Promise<MemoryEntry> {
  const entries = await loadMemoryEntries();
  const normalizedKey = normalizeArabic(key);
  const existing = entries.findIndex((e) => normalizeArabic(e.key) === normalizedKey);

  if (existing >= 0) {
    entries[existing] = {
      ...entries[existing],
      value,
      updatedAt: now(),
      lastAccessedAt: now(),
      tags: [...new Set([...entries[existing].tags, ...tags])],
    };
    await saveMemoryEntries(entries);
    return entries[existing];
  }

  const entry: MemoryEntry = {
    id: generateId(),
    key,
    value,
    category,
    tags,
    confidence: 1.0,
    createdAt: now(),
    updatedAt: now(),
    lastAccessedAt: now(),
  };

  entries.unshift(entry);
  const trimmed = entries.slice(0, MAX_ENTRIES);
  await saveMemoryEntries(trimmed);
  return entry;
}

export async function recall(key: string): Promise<MemoryEntry | null> {
  const entries = await loadMemoryEntries();
  const normalizedKey = normalizeArabic(key);
  const entry = entries.find((e) => normalizeArabic(e.key) === normalizedKey);

  if (entry) {
    entry.lastAccessedAt = now();
    await saveMemoryEntries(entries);
    return entry;
  }
  return null;
}

export async function forget(key: string): Promise<boolean> {
  const entries = await loadMemoryEntries();
  const filtered = entries.filter(
    (e) => normalizeArabic(e.key) !== normalizeArabic(key)
  );
  if (filtered.length === entries.length) return false;
  await saveMemoryEntries(filtered);
  return true;
}

export async function getAllMemories(): Promise<MemoryEntry[]> {
  return loadMemoryEntries();
}

export async function getMemoriesByCategory(category: MemoryCategory): Promise<MemoryEntry[]> {
  const entries = await loadMemoryEntries();
  return entries.filter((e) => e.category === category);
}
