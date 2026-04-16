import { create } from "zustand";
import type { ChatMessage } from "../types/chat.types";
import type { ParsedIntent } from "../types/intent.types";
import { generateId } from "../utils/text";
import { now } from "../utils/time";

interface ChatStore {
  messages: ChatMessage[];
  isLoading: boolean;
  pendingConfirmation: {
    id: string;
    message: string;
    intent: ParsedIntent;
  } | null;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  setLoading: (loading: boolean) => void;
  setPendingConfirmation: (
    data: { id: string; message: string; intent: ParsedIntent } | null
  ) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isLoading: false,
  pendingConfirmation: null,

  setMessages: (messages) => set({ messages }),

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setPendingConfirmation: (pendingConfirmation) => set({ pendingConfirmation }),

  clearMessages: () => set({ messages: [] }),
}));

export function makeUserMessage(text: string): ChatMessage {
  return {
    id: generateId(),
    role: "user",
    content: text,
    contentType: "text",
    status: "delivered",
    timestamp: now(),
  };
}

export function makeAssistantMessage(text: string, isError = false): ChatMessage {
  return {
    id: generateId(),
    role: "assistant",
    content: text,
    contentType: isError ? "error" : "text",
    status: "delivered",
    timestamp: now(),
  };
}
