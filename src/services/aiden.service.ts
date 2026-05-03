// ============================================================
// Aiden API Bridge Service
// يتواصل مع سيرفر Aiden المشغل على بيئة Kali Linux
// Port: 4200 (افتراضي)
// ============================================================

import { AIDEN_ENDPOINTS, AIDEN_TIMEOUTS } from "../config/aiden.config";

// ── أنواع استجابات Aiden ────────────────────────────────────

export interface AidenHealthResponse {
  ok?: boolean;
  status?: string;
  version?: string;
  ts?: number;
  timestamp?: string;
}

export interface AidenChatRequest {
  message: string;
  session?: string;
  mode?: "stream" | "json";
}

export interface AidenStreamChunk {
  token?: string;
  done?: boolean;
  provider?: string;
  activity?: {
    icon: string;
    agent: string;
    message: string;
    style?: string;
  };
  timing?: {
    total_ms: number;
    first_token_ms?: number;
  };
}

export interface AidenChatJsonResponse {
  message?: string;
  response?: string;
  provider?: string;
  toolsUsed?: string[];
  filesCreated?: string[];
  steps?: number;
}

export type ConnectionStatus = "connected" | "disconnected" | "checking" | "error";

// ── فحص الاتصال ────────────────────────────────────────────

export async function checkAidenConnection(serverUrl: string): Promise<{
  status: ConnectionStatus;
  version?: string;
  error?: string;
}> {
  try {
    const url = `${serverUrl.replace(/\/$/, "")}${AIDEN_ENDPOINTS.health}`;
    const response = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(AIDEN_TIMEOUTS.connection),
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return { status: "error", error: `HTTP ${response.status}` };
    }

    const data: AidenHealthResponse = await response.json();
    const version = data.version;

    return { status: "connected", version };
  } catch (err: any) {
    const msg: string = err?.message || String(err);
    if (msg.includes("timeout") || msg.includes("abort")) {
      return { status: "error", error: "انتهت مهلة الاتصال" };
    }
    if (msg.includes("ECONNREFUSED") || msg.includes("Network") || msg.includes("fetch")) {
      return { status: "disconnected", error: "السيرفر غير متاح" };
    }
    return { status: "error", error: msg };
  }
}

// ── إرسال رسالة مع SSE Streaming ───────────────────────────

export async function sendMessageToAiden(
  serverUrl: string,
  request: AidenChatRequest,
  onToken: (token: string) => void,
  onActivity?: (activity: AidenStreamChunk["activity"]) => void,
  onDone?: (provider?: string, timing?: AidenStreamChunk["timing"]) => void,
  onError?: (error: string) => void
): Promise<void> {
  const url = `${serverUrl.replace(/\/$/, "")}${AIDEN_ENDPOINTS.chat}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), AIDEN_TIMEOUTS.chat);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream,application/json",
      },
      body: JSON.stringify({
        message: request.message,
        session: request.session ?? "al-hassan-mobile",
        mode: "stream",
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      onError?.(`خطأ من السيرفر: HTTP ${response.status}`);
      return;
    }

    const contentType = response.headers.get("content-type") ?? "";

    // ── JSON mode (non-streaming) ──────────────────────────
    if (contentType.includes("application/json") && !contentType.includes("event-stream")) {
      const data: AidenChatJsonResponse = await response.json();
      const text = data.message ?? data.response ?? "";
      if (text) {
        onToken(text);
      }
      onDone?.(data.provider);
      return;
    }

    // ── SSE streaming mode ─────────────────────────────────
    const reader = response.body?.getReader();
    if (!reader) {
      onError?.("لا يمكن قراءة الاستجابة من السيرفر");
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === ":") continue;

        if (trimmed.startsWith("data: ")) {
          const jsonStr = trimmed.slice(6).trim();
          if (jsonStr === "[DONE]") {
            onDone?.();
            return;
          }

          try {
            const chunk: AidenStreamChunk = JSON.parse(jsonStr);

            if (chunk.activity) {
              onActivity?.(chunk.activity);
            }

            if (chunk.token !== undefined && chunk.token !== null) {
              onToken(chunk.token);
            }

            if (chunk.done === true) {
              onDone?.(chunk.provider, chunk.timing);
              return;
            }
          } catch {
            // تجاهل أسطر SSE غير صالحة
          }
        }
      }
    }

    onDone?.();
  } catch (err: any) {
    const msg: string = err?.message || String(err);
    if (msg.includes("abort") || msg.includes("timeout")) {
      onError?.("انتهت مهلة الاتصال. تأكد أن سيرفر Aiden يعمل.");
    } else if (msg.includes("ECONNREFUSED") || msg.includes("Network") || msg.includes("Failed to fetch")) {
      onError?.("لا يمكن الوصول إلى السيرفر. تأكد أن Kali Linux يعمل والـ IP صحيح.");
    } else {
      onError?.(msg);
    }
  }
}
