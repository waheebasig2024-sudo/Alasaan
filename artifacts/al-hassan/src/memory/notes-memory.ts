import type { NoteEntry } from "../types/memory.types";
import { generateId } from "../utils/text";
import { now } from "../utils/time";
import { loadNotes, saveNotes } from "./schemas";

let _notes: NoteEntry[] | null = null;

async function load(): Promise<NoteEntry[]> {
  if (_notes) return _notes;
  _notes = await loadNotes();
  return _notes;
}

export async function createNote(
  title: string,
  content: string,
  tags: string[] = []
): Promise<NoteEntry> {
  const notes = await load();
  const note: NoteEntry = {
    id: generateId(),
    title,
    content,
    tags,
    createdAt: now(),
    updatedAt: now(),
  };
  notes.unshift(note);
  _notes = notes;
  await saveNotes(notes);
  return note;
}

export async function getNotes(): Promise<NoteEntry[]> {
  return load();
}

export async function getNoteById(id: string): Promise<NoteEntry | null> {
  const notes = await load();
  return notes.find((n) => n.id === id) ?? null;
}

export async function updateNote(
  id: string,
  updates: Partial<Pick<NoteEntry, "title" | "content" | "tags">>
): Promise<NoteEntry | null> {
  const notes = await load();
  const idx = notes.findIndex((n) => n.id === id);
  if (idx < 0) return null;
  notes[idx] = { ...notes[idx], ...updates, updatedAt: now() };
  _notes = notes;
  await saveNotes(notes);
  return notes[idx];
}

export async function deleteNote(id: string): Promise<boolean> {
  const notes = await load();
  const filtered = notes.filter((n) => n.id !== id);
  if (filtered.length === notes.length) return false;
  _notes = filtered;
  await saveNotes(filtered);
  return true;
}

export async function searchNotes(query: string): Promise<NoteEntry[]> {
  const notes = await load();
  const q = query.toLowerCase();
  return notes.filter(
    (n) =>
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      n.tags.some((t) => t.toLowerCase().includes(q))
  );
}
