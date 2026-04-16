import { APP_CONFIG } from "../constants/app-config";
import { fetchWithTimeout } from "../services/network.service";
import { isOnline } from "../services/network.service";
import { logger } from "../utils/logger";
import { buildSystemPrompt } from "./personality";
import type { ChatMessage } from "../types/chat.types";
import { buildGeminiHistory } from "../memory/conversation-memory";

export interface GeminiResponse {
  text: string;
  success: boolean;
  error?: string;
}

export interface GeminiRequest {
  message: string;
  history?: ChatMessage[];
  systemPrompt?: string;
}

export async function askGemini(request: GeminiRequest): Promise<GeminiResponse> {
  const online = await isOnline();
  if (!online) {
    return {
      text: "",
      success: false,
      error: "لا يوجد اتصال بالإنترنت",
    };
  }

  try {
    const systemPrompt = request.systemPrompt ?? (await buildSystemPrompt());
    const history = request.history ? buildGeminiHistory(request.history) : [];

    const apiUrl = `https://${process.env.EXPO_PUBLIC_DOMAIN}${APP_CONFIG.GEMINI_ENDPOINT}`;

    const response = await fetchWithTimeout<{ text: string; error?: string }>(
      apiUrl,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: request.message,
          history,
          systemPrompt,
          model: APP_CONFIG.GEMINI_MODEL,
        }),
      },
      APP_CONFIG.REQUEST_TIMEOUT_MS
    );

    if (response.error) {
      return { text: "", success: false, error: response.error };
    }

    logger.info("gemini-client", "Response received");
    return { text: response.text, success: true };
  } catch (error) {
    logger.error("gemini-client", "Request failed", error);
    return {
      text: "",
      success: false,
      error: "فشل الاتصال بـ Gemini",
    };
  }
}
