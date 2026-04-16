import React, { createContext, useContext, useCallback, useEffect } from "react";
import { useChatStore, makeUserMessage, makeAssistantMessage } from "../store/chat.store";
import { useSessionStore } from "../store/session.store";
import { useSettings } from "./SettingsProvider";
import { processMessage } from "../core/router";
import { executeConfirmedAction } from "../core/execution-pipeline";
import { getOrCreateSession, clearSession } from "../core/chat-session";
import { buildWelcomeMessage } from "../core/personality";
import { clearHistory } from "../memory/conversation-memory";
import type { ChatMessage } from "../types/chat.types";
import type { ParsedIntent } from "../types/intent.types";
import { generateId } from "../utils/text";
import { now } from "../utils/time";

interface AssistantContextValue {
  sendMessage: (text: string) => Promise<void>;
  confirmAction: (confirmed: boolean) => Promise<void>;
  clearChat: () => Promise<void>;
  isLoading: boolean;
}

const AssistantContext = createContext<AssistantContextValue | null>(null);

export function AssistantProvider({ children }: { children: React.ReactNode }) {
  const { messages, addMessage, setLoading, isLoading, pendingConfirmation, setPendingConfirmation } =
    useChatStore();
  const { sessionId, userId } = useSessionStore();
  const { settings } = useSettings();

  useEffect(() => {
    async function init() {
      const session = await getOrCreateSession();
      if (session.messages.length === 0) {
        const welcome = await buildWelcomeMessage();
        const welcomeMsg: ChatMessage = {
          id: generateId(),
          role: "assistant",
          content: welcome,
          contentType: "text",
          status: "delivered",
          timestamp: now(),
        };
        addMessage(welcomeMsg);
      } else {
        useChatStore.setState({ messages: session.messages });
      }
    }
    init();
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMsg = makeUserMessage(text);
      addMessage(userMsg);
      setLoading(true);

      try {
        const currentHistory = [...messages, userMsg];
        const result = await processMessage({
          text,
          sessionId,
          userId,
          settings,
          history: currentHistory,
        });

        if (result.requiresConfirmation && result.confirmationId && result.pendingIntent) {
          setPendingConfirmation({
            id: result.confirmationId,
            message: result.message,
            intent: result.pendingIntent as ParsedIntent,
          });
        }

        const assistantMsg = makeAssistantMessage(result.message, !result.success);
        addMessage(assistantMsg);
      } catch (error) {
        const errMsg = makeAssistantMessage("حدث خطأ. يرجى المحاولة مرة أخرى.", true);
        addMessage(errMsg);
      } finally {
        setLoading(false);
      }
    },
    [isLoading, messages, sessionId, userId, settings]
  );

  const confirmAction = useCallback(
    async (confirmed: boolean) => {
      if (!pendingConfirmation) return;

      setPendingConfirmation(null);

      if (!confirmed) {
        addMessage(makeAssistantMessage("تم إلغاء الإجراء."));
        return;
      }

      setLoading(true);
      try {
        const result = await executeConfirmedAction(pendingConfirmation.intent, userId);
        addMessage(makeAssistantMessage(result.message, !result.success));
      } finally {
        setLoading(false);
      }
    },
    [pendingConfirmation, userId]
  );

  const clearChat = useCallback(async () => {
    useChatStore.getState().clearMessages();
    clearSession();
    await clearHistory();
    const welcome = await buildWelcomeMessage();
    const welcomeMsg: ChatMessage = {
      id: generateId(),
      role: "assistant",
      content: welcome,
      contentType: "text",
      status: "delivered",
      timestamp: now(),
    };
    useChatStore.getState().addMessage(welcomeMsg);
  }, []);

  return (
    <AssistantContext.Provider value={{ sendMessage, confirmAction, clearChat, isLoading }}>
      {children}
    </AssistantContext.Provider>
  );
}

export function useAssistant(): AssistantContextValue {
  const ctx = useContext(AssistantContext);
  if (!ctx) throw new Error("useAssistant must be used within AssistantProvider");
  return ctx;
}
