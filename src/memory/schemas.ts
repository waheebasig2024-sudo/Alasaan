import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../constants/storage-keys";
import type { MemoryEntry, NoteEntry, UserProfile } from "../types/memory.types";

export async function loadMemoryEntries(): Promise<MemoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.MEMORY_ENTRIES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveMemoryEntries(entries: MemoryEntry[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.MEMORY_ENTRIES, JSON.stringify(entries));
}

export async function loadUserProfile(): Promise<UserProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
}

export async function loadNotes(): Promise<NoteEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.NOTES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveNotes(notes: NoteEntry[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
}
