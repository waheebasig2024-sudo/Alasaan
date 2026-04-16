import { useChatStore } from "../store/chat.store";
import { useAssistant } from "../providers/AssistantProvider";

export function useChatSession() {
  const { messages, isLoading, pendingConfirmation } = useChatStore();
  const { sendMessage, confirmAction, clearChat } = useAssistant();

  return {
    messages,
    isLoading,
    pendingConfirmation,
    sendMessage,
    confirmAction,
    clearChat,
  };
}
