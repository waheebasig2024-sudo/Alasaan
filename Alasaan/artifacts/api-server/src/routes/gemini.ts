import { Router } from "express";
import { ai } from "@workspace/integrations-gemini-ai";
import { logger } from "../lib/logger";

const router = Router();

function isQuotaError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes("quota") ||
      msg.includes("rate limit") ||
      msg.includes("429") ||
      msg.includes("resource_exhausted") ||
      msg.includes("too many requests")
    );
  }
  return false;
}

function normalizeGeminiHistory(history: unknown[]): Array<{
  role: "user" | "model";
  parts: Array<{ text: string }>;
}> {
  if (!Array.isArray(history)) return [];

  return history
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const entry = item as { role?: string; parts?: Array<{ text?: string }> };
      const role = entry.role === "assistant" || entry.role === "model" ? "model" : "user";
      const text = entry.parts?.map((part) => part.text).filter(Boolean).join("\n");
      if (!text) return null;
      return { role, parts: [{ text }] };
    })
    .filter((item): item is { role: "user" | "model"; parts: Array<{ text: string }> } => item !== null);
}

async function askGeminiSafely(
  message: string,
  history: unknown[],
  systemPrompt: string | undefined,
  model: string
): Promise<string> {
  const response = await ai.models.generateContent({
    model,
    contents: [
      ...normalizeGeminiHistory(history),
      { role: "user", parts: [{ text: message }] },
    ],
    config: {
      systemInstruction: systemPrompt,
      temperature: 0.7,
      maxOutputTokens: 8192,
      topP: 0.9,
    },
  });

  const text = response.text;
  if (!text) throw new Error("لم يرجع Gemini إجابة مؤكدة");
  return text;
}

router.post("/gemini/chat", async (req, res) => {
  try {
    const { message, history = [], systemPrompt, model = "gemini-2.5-flash" } = req.body;

    if (!message || typeof message !== "string") {
      res.status(400).json({ error: "الرسالة مطلوبة" });
      return;
    }

    const text = await askGeminiSafely(message, history, systemPrompt, model);
    res.json({ text, success: true });
  } catch (error: unknown) {
    logger.error({ err: error }, "Gemini request failed");
    const errMsg =
      error instanceof Error ? error.message : "خطأ في معالجة الطلب";

    const isQuota = isQuotaError(error);
    res.status(isQuota ? 429 : 500).json({
      error: isQuota
        ? "انتهت حصة Gemini المتاحة. يرجى المحاولة لاحقاً."
        : errMsg,
      success: false,
    });
  }
});

router.get("/gemini/status", (_req, res) => {
  const configured =
    !!process.env.AI_INTEGRATIONS_GEMINI_BASE_URL &&
    !!process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
  res.json({
    configured,
    model: "gemini-2.5-flash",
    status: configured ? "ready" : "missing_managed_gemini_config",
  });
});

export default router;
