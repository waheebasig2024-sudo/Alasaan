import { useAssistant } from "../providers/AssistantProvider";
import { useSessionStore } from "../store/session.store";
import { useSettingsStore } from "../store/settings.store";

export function useAssistantRouter() {
  const { sendMessage, isLoading } = useAssistant();
  const { sessionId } = useSessionStore();
  const { settings } = useSettingsStore();

  return { sendMessage, isLoading, sessionId, settings };
}
