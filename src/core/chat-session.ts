import type { ChatMessage, ChatSession } from "../types/chat.types";
import { generateId } from "../utils/text";
import { now } from "../utils/time";
import { appendMessage, getConversationHistory } from "../memory/conversation-memory";

let _currentSession: ChatSession | null = null;

export async function getOrCreateSession(): Promise<ChatSession> {
  if (_currentSession) return _currentSession;

  const history = await getConversationHistory();
  _currentSession = {
    id: generateId(),
    messages: history,
    createdAt: now(),
    lastActiveAt: now(),
  };

  return _currentSession;
}

export function createMessage(
  role: ChatMessage["role"],
  content: string,
  options: Partial<ChatMessage> = {}
): ChatMessage {
  return {
    id: generateId(),
    role,
    content,
    contentType: "text",
    status: role === "user" ? "delivered" : "delivered",
    timestamp: now(),
    ...options,
  };
}

export async function addMessage(message: ChatMessage): Promise<void> {
  if (_currentSession) {
    _currentSession.messages.push(message);
    _currentSession.lastActiveAt = now();
  }
  await appendMessage(message);
}

export function getCurrentSession(): ChatSession | null {
  return _currentSession;
}

export function clearSession(): void {
  _currentSession = null;
}
