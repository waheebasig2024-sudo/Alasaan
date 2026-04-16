import { create } from "zustand";
import type { MemoryEntry, NoteEntry, UserProfile } from "../types/memory.types";
import { getAllMemories } from "../memory/memory-manager";
import { getNotes } from "../memory/notes-memory";
import { getProfile } from "../memory/personal-memory";

interface MemoryStore {
  entries: MemoryEntry[];
  notes: NoteEntry[];
  profile: UserProfile | null;
  isLoaded: boolean;
  loadAll: () => Promise<void>;
  refreshNotes: () => Promise<void>;
  refreshEntries: () => Promise<void>;
}

export const useMemoryStore = create<MemoryStore>((set) => ({
  entries: [],
  notes: [],
  profile: null,
  isLoaded: false,

  loadAll: async () => {
    const [entries, notes, profile] = await Promise.all([
      getAllMemories(),
      getNotes(),
      getProfile(),
    ]);
    set({ entries, notes, profile, isLoaded: true });
  },

  refreshNotes: async () => {
    const notes = await getNotes();
    set({ notes });
  },

  refreshEntries: async () => {
    const entries = await getAllMemories();
    set({ entries });
  },
}));
