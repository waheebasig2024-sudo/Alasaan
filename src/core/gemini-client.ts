import { APP_CONFIG } from "../constants/app-config";
import { fetchWithTimeout } from "../services/network.service";
import { logger } from "../utils/logger";
import { buildSystemPrompt } from "./personality";
import type { ChatMessage } from "../types/chat.types";
import { buildGeminiHistory } from "../memory/conversation-memory";
import {
  askGeminiDirect,
  hasDirectGeminiKeys,
  getConfiguredModel,
} from "./gemini-direct";
import Constants from "expo-constants";

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

function resolveApiDomain(): string | null {
  const extra = (Constants.expoConfig?.extra as Record<string, unknown>) || {};
  const fromExtra = (extra.apiDomain as string) || "";
  const domain =
    fromExtra ||
    process.env.EXPO_PUBLIC_DOMAIN ||
    process.env.EXPO_PUBLIC_API_DOMAIN ||
    process.env.EXPO_PUBLIC_API_URL ||
    "";
  if (!domain) return null;
  return domain.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

async function tryProxy(
  request: GeminiRequest,
  systemPrompt: string,
  history: ReturnType<typeof buildGeminiHistory>
): Promise<GeminiResponse | null> {
  const domain = resolveApiDomain();
  if (!domain) return null;
  const apiUrl = `https://${domain}${APP_CONFIG.GEMINI_ENDPOINT}`;
  try {
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
    logger.info("gemini-client", "Proxy response received");
    return { text: response.text, success: true };
  } catch (error) {
    const rawMsg = error instanceof Error ? error.message : String(error);
    logger.warn("gemini-client", `Proxy failed at ${apiUrl}: ${rawMsg}`);
    return { text: "", success: false, error: `proxy: ${rawMsg}` };
  }
}

export async function askGemini(
  request: GeminiRequest
): Promise<GeminiResponse> {
  const systemPrompt = request.systemPrompt ?? (await buildSystemPrompt());
  const history = request.history ? buildGeminiHistory(request.history) : [];

  const directAvailable = hasDirectGeminiKeys();

  if (directAvailable) {
    const direct = await askGeminiDirect({
      message: request.message,
      history: history as any,
      systemInstruction: systemPrompt,
      model: getConfiguredModel(),
      temperature: APP_CONFIG.GEMINI_TEMPERATURE,
      maxTokens: APP_CONFIG.GEMINI_MAX_TOKENS,
      timeoutMs: APP_CONFIG.REQUEST_TIMEOUT_MS,
    });
    if (direct.success) return direct;
    logger.warn(
      "gemini-client",
      `Direct call failed, trying proxy. err=${direct.error}`
    );
    const viaProxy = await tryProxy(request, systemPrompt, history);
    if (viaProxy && viaProxy.success) return viaProxy;
    return {
      text: "",
      success: false,
      error: `${direct.error}${
        viaProxy?.error ? `\nالبروكسي أيضاً فشل: ${viaProxy.error}` : ""
      }`,
    };
  }

  const viaProxy = await tryProxy(request, systemPrompt, history);
  if (viaProxy) return viaProxy;

  return {
    text: "",
    success: false,
    error:
      "لا توجد مفاتيح Gemini مدمجة في التطبيق ولا خادم API مهيأ. أضف GEMINI_KEY_1/2/3 في .env.local قبل البناء، أو حدّد EXPO_PUBLIC_DOMAIN.",
  };
}
