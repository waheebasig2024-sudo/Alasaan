import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "../lib/logger";

const router = Router();

function getGeminiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY غير مضبوط في أسرار البيئة");
  }
  return apiKey;
}

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

async function askGeminiWithRotation(
  message: string,
  history: unknown[],
  systemPrompt: string | undefined,
  model: string
): Promise<string> {
  const genAI = new GoogleGenerativeAI(getGeminiKey());
  const genModel = genAI.getGenerativeModel({
    model,
    systemInstruction: systemPrompt,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
      topP: 0.9,
    },
  });

  const chat = genModel.startChat({
    history: Array.isArray(history) ? history : [],
  });

  try {
    const result = await chat.sendMessage(message);
    return result.response.text();
  } catch (error) {
    throw error;
  }
}

router.post("/gemini/chat", async (req, res) => {
  try {
    const { message, history = [], systemPrompt, model = "gemini-2.5-flash" } = req.body;

    if (!message || typeof message !== "string") {
      res.status(400).json({ error: "الرسالة مطلوبة" });
      return;
    }

    const text = await askGeminiWithRotation(message, history, systemPrompt, model);
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

// Status endpoint to check which key is active (index only, never expose key value)
router.get("/gemini/status", (_req, res) => {
  const usingEnv = !!process.env.GEMINI_API_KEY;
  res.json({
    configured: usingEnv,
    model: "gemini-2.5-flash",
    status: usingEnv ? "ready" : "missing_api_key",
  });
});

export default router;
