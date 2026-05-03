import Constants from "expo-constants";
import { logger } from "../utils/logger";

interface GeminiContent {
  role: "user" | "model";
  parts: { text: string }[];
}

interface DirectGeminiOptions {
  systemInstruction?: string;
  history?: GeminiContent[];
  message: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

export interface DirectGeminiResult {
  text: string;
  success: boolean;
  error?: string;
  keyIndex?: number;
}

function getKeys(): string[] {
  const extra =
    (Constants.expoConfig?.extra as Record<string, unknown>) ||
    (Constants.manifest2?.extra?.expoClient as any)?.extra ||
    {};
  const fromExtra = (extra.geminiKeys as string[]) || [];
  if (Array.isArray(fromExtra) && fromExtra.length > 0) return fromExtra;

  const fromEnv = [
    process.env.EXPO_PUBLIC_GEMINI_KEY_1,
    process.env.EXPO_PUBLIC_GEMINI_KEY_2,
    process.env.EXPO_PUBLIC_GEMINI_KEY_3,
  ].filter((k): k is string => typeof k === "string" && k.length > 0);
  return fromEnv;
}

export function hasDirectGeminiKeys(): boolean {
  return getKeys().length > 0;
}

export function getConfiguredModel(): string {
  const extra = (Constants.expoConfig?.extra as Record<string, unknown>) || {};
  return (extra.geminiModel as string) || "gemini-2.5-flash";
}

async function callOnce(
  apiKey: string,
  model: string,
  body: unknown,
  timeoutMs: number
): Promise<{ ok: boolean; status: number; text?: string; error?: string }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg =
        (data as any)?.error?.message ||
        `HTTP ${res.status} ${res.statusText}`;
      return { ok: false, status: res.status, error: msg };
    }
    const text =
      (data as any)?.candidates?.[0]?.content?.parts
        ?.map((p: any) => p.text)
        .join("") || "";
    if (!text) {
      return {
        ok: false,
        status: res.status,
        error: "Gemini أعاد رداً فارغاً.",
      };
    }
    return { ok: true, status: res.status, text };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, status: 0, error: msg };
  } finally {
    clearTimeout(timer);
  }
}

export async function askGeminiDirect(
  opts: DirectGeminiOptions
): Promise<DirectGeminiResult> {
  const keys = getKeys();
  if (keys.length === 0) {
    return {
      text: "",
      success: false,
      error: "لا توجد مفاتيح Gemini مدمجة في التطبيق.",
    };
  }

  const model = opts.model || getConfiguredModel();
  const timeoutMs = opts.timeoutMs ?? 20000;

  const contents: GeminiContent[] = [
    ...(opts.history || []),
    { role: "user", parts: [{ text: opts.message }] },
  ];

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: opts.temperature ?? 0.7,
      maxOutputTokens: opts.maxTokens ?? 8192,
    },
  };
  if (opts.systemInstruction) {
    body.systemInstruction = { parts: [{ text: opts.systemInstruction }] };
  }

  const errors: string[] = [];
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    logger.info("gemini-direct", `Trying key #${i + 1}/${keys.length}`);
    const result = await callOnce(key, model, body, timeoutMs);
    if (result.ok && result.text) {
      return { text: result.text, success: true, keyIndex: i };
    }
    errors.push(`مفتاح ${i + 1}: ${result.error || "فشل"}`);
    if (
      result.status &&
      result.status !== 429 &&
      result.status !== 403 &&
      result.status < 500
    ) {
      break;
    }
  }

  return {
    text: "",
    success: false,
    error: `فشل جميع مفاتيح Gemini (${keys.length}):\n${errors.join("\n")}`,
  };
}
