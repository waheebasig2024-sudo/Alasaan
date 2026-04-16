import type { MemoryEntry, MemoryCategory } from "../types/memory.types";
import { normalizeArabic } from "../utils/text";
import { loadMemoryEntries } from "./schemas";

export async function searchMemory(
  query: string,
  category?: MemoryCategory
): Promise<MemoryEntry[]> {
  const entries = await loadMemoryEntries();
  const normalized = normalizeArabic(query);

  return entries
    .filter((e) => {
      if (category && e.category !== category) return false;
      return (
        normalizeArabic(e.key).includes(normalized) ||
        normalizeArabic(e.value).includes(normalized) ||
        e.tags.some((t) => normalizeArabic(t).includes(normalized))
      );
    })
    .sort((a, b) => b.lastAccessedAt - a.lastAccessedAt);
}

export async function findMemoryByKey(key: string): Promise<MemoryEntry | null> {
  const entries = await loadMemoryEntries();
  const normalized = normalizeArabic(key);
  return (
    entries.find((e) => normalizeArabic(e.key) === normalized) ?? null
  );
}
