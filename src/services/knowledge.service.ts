// ============================================================
// Knowledge Vault Service — قراءة وتعديل ذاكرة Aiden
// LESSONS.md + user-profile.json
// ============================================================

export interface Lesson {
  id: string;
  content: string;
  category?: string;
  approved: boolean;
  createdAt?: string;
}

export interface UserProfile {
  name?: string;
  preferences?: Record<string, unknown>;
  skills?: string[];
  goals?: string[];
  [key: string]: unknown;
}

export interface KnowledgeVaultData {
  lessons: Lesson[];
  rawLessons: string;
  profile: UserProfile | null;
  rawProfile: string;
  fetchedAt: number;
}

// ── Fetch raw LESSONS.md ─────────────────────────────────────

export async function fetchLessonsRaw(serverUrl: string): Promise<string> {
  const base = serverUrl.replace(/\/$/, "");
  try {
    const res = await fetch(`${base}/api/memory/lessons`, {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "text/plain, application/json" },
    });
    if (!res.ok) return "";
    const ct = res.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) {
      const j = await res.json();
      return j.content ?? j.data ?? JSON.stringify(j, null, 2);
    }
    return await res.text();
  } catch {
    return "";
  }
}

// ── Fetch user-profile.json ──────────────────────────────────

export async function fetchUserProfile(serverUrl: string): Promise<{ profile: UserProfile | null; raw: string }> {
  const base = serverUrl.replace(/\/$/, "");
  try {
    const res = await fetch(`${base}/api/memory/profile`, {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return { profile: null, raw: "" };
    const raw = await res.text();
    try {
      const profile = JSON.parse(raw) as UserProfile;
      return { profile, raw };
    } catch {
      return { profile: null, raw };
    }
  } catch {
    return { profile: null, raw: "" };
  }
}

// ── Parse lessons from markdown ──────────────────────────────

export function parseLessons(markdown: string): Lesson[] {
  if (!markdown.trim()) return [];

  const lessons: Lesson[] = [];
  const lines = markdown.split("\n");
  let currentContent = "";
  let currentCategory = "عام";

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("## ") || trimmed.startsWith("# ")) {
      if (currentContent.trim()) {
        lessons.push({
          id: `lesson-${lessons.length}`,
          content: currentContent.trim(),
          category: currentCategory,
          approved: true,
          createdAt: undefined,
        });
        currentContent = "";
      }
      currentCategory = trimmed.replace(/^#{1,2}\s*/, "").trim();
      continue;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (currentContent.trim()) {
        lessons.push({
          id: `lesson-${lessons.length}`,
          content: currentContent.trim(),
          category: currentCategory,
          approved: true,
        });
        currentContent = "";
      }
      currentContent = trimmed.slice(2).trim();
    } else if (trimmed && !trimmed.startsWith("#")) {
      if (currentContent) {
        currentContent += " " + trimmed;
      } else {
        currentContent = trimmed;
      }
    }
  }

  if (currentContent.trim()) {
    lessons.push({
      id: `lesson-${lessons.length}`,
      content: currentContent.trim(),
      category: currentCategory,
      approved: true,
    });
  }

  return lessons.filter((l) => l.content.length > 5);
}

// ── Update a lesson ──────────────────────────────────────────

export async function updateLesson(
  serverUrl: string,
  lesson: Lesson
): Promise<boolean> {
  const base = serverUrl.replace(/\/$/, "");
  try {
    const res = await fetch(`${base}/api/memory/lessons/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: lesson.id, content: lesson.content, approved: lesson.approved }),
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Delete a lesson ──────────────────────────────────────────

export async function deleteLesson(
  serverUrl: string,
  lessonId: string
): Promise<boolean> {
  const base = serverUrl.replace(/\/$/, "");
  try {
    const res = await fetch(`${base}/api/memory/lessons/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: lessonId }),
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
