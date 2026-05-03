export interface UserProfile {
  id: string;
  name: string;
  preferredLanguage: "ar" | "en";
  preferredApps: string[];
  importantPeople: PersonEntry[];
  preferences: Record<string, string>;
  createdAt: number;
  updatedAt: number;
}

export interface PersonEntry {
  name: string;
  aliases: string[];
  phoneNumber?: string;
  relationship?: string;
}

export interface MemoryEntry {
  id: string;
  key: string;
  value: string;
  category: MemoryCategory;
  tags: string[];
  confidence: number;
  createdAt: number;
  updatedAt: number;
  lastAccessedAt: number;
}

export type MemoryCategory =
  | "personal"
  | "preference"
  | "person"
  | "app_alias"
  | "command_pattern"
  | "note"
  | "fact"
  | "routine";

export interface ConversationContext {
  sessionId: string;
  lastSubject?: string;
  lastAction?: string;
  lastPerson?: string;
  lastApp?: string;
  lastLocation?: string;
  recentEntities: Record<string, string>;
  turnCount: number;
}

export interface NoteEntry {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}
