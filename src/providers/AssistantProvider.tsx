import React, { createContext, useContext, useCallback, useEffect, useRef } from "react";
import { useChatStore, makeUserMessage, makeAssistantMessage } from "../store/chat.store";
import { useSessionStore } from "../store/session.store";
import { useSettings } from "./SettingsProvider";
import { processMessage } from "../core/router";
import { executeConfirmedAction } from "../core/execution-pipeline";
import { getOrCreateSession, clearSession } from "../core/chat-session";
import { buildWelcomeMessage } from "../core/personality";
import { clearHistory } from "../memory/conversation-memory";
import { useSpeech } from "../hooks/useSpeech";
import type { ChatMessage } from "../types/chat.types";
import type { ParsedIntent } from "../types/intent.types";
import { generateId } from "../utils/text";
import { now } from "../utils/time";

interface AssistantContextValue {
  sendMessage: (text: string) => Promise<void>;
  confirmAction: (confirmed: boolean) => Promise<void>;
  clearChat: () => Promise<void>;
  isLoading: boolean;
  isSpeakingState: boolean;
}

const AssistantContext = createContext<AssistantContextValue | null>(null);

export function AssistantProvider({ children }: { children: React.ReactNode }) {
  const { messages, addMessage, setLoading, isLoading, pendingConfirmation, setPendingConfirmation } =
    useChatStore();
  const { sessionId, userId } = useSessionStore();
  const { settings } = useSettings();
  const { speak, stop, isSpeakingState } = useSpeech();
  const isLoadingRef = useRef(isLoading);
  isLoadingRef.current = isLoading;

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
        if (settings.voiceEnabled) {
          speak(welcome, { gender: settings.voiceGender });
        }
      } else {
        useChatStore.setState({ messages: session.messages });
      }
    }
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoadingRef.current) return;

      stop();

      const userMsg = makeUserMessage(text);
      addMessage(userMsg);
      setLoading(true);

      try {
        const currentHistory = [...useChatStore.getState().messages];
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

        // Build assistant message — include tool result if present
        const assistantMsg: ChatMessage = {
          id: generateId(),
          role: "assistant",
          content: result.message,
          contentType: result.success ? "text" : "error",
          status: "delivered",
          timestamp: now(),
          toolResult: (result as any).toolResult ?? undefined,
        };
        addMessage(assistantMsg);

        if (settings.voiceEnabled && result.message) {
          speak(result.message, { gender: settings.voiceGender });
        }
      } catch {
        const errMsg = makeAssistantMessage("والله صار خطأ، جرب مرة ثانية.", true);
        addMessage(errMsg);
        if (settings.voiceEnabled) {
          speak("صار خطأ، جرب مرة ثانية.", { gender: settings.voiceGender });
        }
      } finally {
        setLoading(false);
      }
    },
    [sessionId, userId, settings, speak, stop, addMessage, setLoading, setPendingConfirmation]
  );

  const confirmAction = useCallback(
    async (confirmed: boolean) => {
      if (!pendingConfirmation) return;

      setPendingConfirmation(null);

      if (!confirmed) {
        const cancelMsg = makeAssistantMessage("زين، تم إلغاء الأمر.");
        addMessage(cancelMsg);
        if (settings.voiceEnabled) speak("زين، تم إلغاء الأمر.", { gender: settings.voiceGender });
        return;
      }

      setLoading(true);
      try {
        const result = await executeConfirmedAction(pendingConfirmation.intent, userId);
        const msg: ChatMessage = {
          id: generateId(),
          role: "assistant",
          content: result.message,
          contentType: result.success ? "text" : "error",
          status: "delivered",
          timestamp: now(),
          toolResult: (result as any).toolResult ?? undefined,
        };
        addMessage(msg);
        if (settings.voiceEnabled && result.message) {
          speak(result.message, { gender: settings.voiceGender });
        }
      } finally {
        setLoading(false);
      }
    },
    [pendingConfirmation, userId, settings, speak, addMessage, setLoading, setPendingConfirmation]
  );

  const clearChat = useCallback(async () => {
    stop();
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
    if (settings.voiceEnabled) {
      speak(welcome, { gender: settings.voiceGender });
    }
  }, [settings, speak, stop]);

  return (
    <AssistantContext.Provider value={{ sendMessage, confirmAction, clearChat, isLoading, isSpeakingState }}>
      {children}
    </AssistantContext.Provider>
  );
}

export function useAssistant(): AssistantContextValue {
  const ctx = useContext(AssistantContext);
  if (!ctx) throw new Error("useAssistant must be used within AssistantProvider");
  return ctx;
}
