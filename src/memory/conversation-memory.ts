import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../constants/storage-keys";
import type { ChatMessage } from "../types/chat.types";
import type { ConversationContext } from "../types/memory.types";
import { now } from "../utils/time";

const MAX_HISTORY = 50;

let _context: ConversationContext | null = null;

function defaultContext(sessionId: string): ConversationContext {
  return {
    sessionId,
    recentEntities: {},
    turnCount: 0,
  };
}

export async function getContext(sessionId: string): Promise<ConversationContext> {
  if (_context?.sessionId === sessionId) return _context as ConversationContext;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATION_CONTEXT);
    const stored = raw ? JSON.parse(raw) : null;
    _context = (stored?.sessionId === sessionId ? stored : null) ?? defaultContext(sessionId);
    return _context as ConversationContext;
  } catch {
    _context = defaultContext(sessionId);
    return _context;
  }
}

export async function updateContext(
  sessionId: string,
  updates: Partial<ConversationContext>
): Promise<void> {
  const ctx = await getContext(sessionId);
  _context = { ...ctx, ...updates, sessionId };
  await AsyncStorage.setItem(
    STORAGE_KEYS.CONVERSATION_CONTEXT,
    JSON.stringify(_context)
  );
}

export async function addTurn(
  sessionId: string,
  entities: Record<string, string>
): Promise<void> {
  const ctx = await getContext(sessionId);
  const merged = { ...ctx.recentEntities, ...entities };
  await updateContext(sessionId, {
    recentEntities: merged,
    turnCount: ctx.turnCount + 1,
  });
}

export async function getConversationHistory(): Promise<ChatMessage[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATION_HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function appendMessage(message: ChatMessage): Promise<void> {
  const history = await getConversationHistory();
  history.push(message);
  const trimmed = history.slice(-MAX_HISTORY);
  await AsyncStorage.setItem(
    STORAGE_KEYS.CONVERSATION_HISTORY,
    JSON.stringify(trimmed)
  );
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.CONVERSATION_HISTORY);
  _context = null;
}

export function buildGeminiHistory(
  messages: ChatMessage[]
): Array<{ role: string; parts: Array<{ text: string }> }> {
  return messages
    .filter((m) => m.contentType === "text")
    .slice(-10)
    .map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));
}

export function formatHistoryForPrompt(messages: ChatMessage[]): string {
  return messages
    .slice(-8)
    .filter((m) => m.contentType === "text")
    .map((m) => `${m.role === "user" ? "المستخدم" : "الحسن"}: ${m.content}`)
    .join("\n");
}
