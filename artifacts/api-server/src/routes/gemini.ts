import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = Router();

// Built-in API key pool with automatic rotation on quota exhaustion
const BUILTIN_KEYS = [
  "AIzaSyCzUgX5QA9keBCKs8vtJ8KwaqJLZzW4bGA",
  "AIzaSyCG95BxiM7DY-X6_hhIlkqsbLNXDx4G6dw",
  "AIzaSyB-ea4B-GjiFNoVpaMJeYDgf6KZ6eeGjJs",
];

let currentKeyIndex = 0;

function getNextKey(): string | null {
  // Try env var first, then fall back to built-in pool
  if (process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  if (BUILTIN_KEYS.length === 0) return null;
  return BUILTIN_KEYS[currentKeyIndex % BUILTIN_KEYS.length];
}

function rotateKey(): void {
  currentKeyIndex = (currentKeyIndex + 1) % BUILTIN_KEYS.length;
  console.log(`[gemini] Rotating to key index ${currentKeyIndex}`);
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
  model: string,
  attemptsLeft = BUILTIN_KEYS.length
): Promise<string> {
  const apiKey = getNextKey();
  if (!apiKey) throw new Error("لا توجد مفاتيح Gemini API متاحة");

  const genAI = new GoogleGenerativeAI(apiKey);
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
    if (isQuotaError(error) && attemptsLeft > 1 && !process.env.GEMINI_API_KEY) {
      rotateKey();
      return askGeminiWithRotation(
        message,
        history,
        systemPrompt,
        model,
        attemptsLeft - 1
      );
    }
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
    console.error("[gemini] Error:", error);
    const errMsg =
      error instanceof Error ? error.message : "خطأ في معالجة الطلب";

    const isQuota = isQuotaError(error);
    res.status(isQuota ? 429 : 500).json({
      error: isQuota
        ? "انتهت حصة جميع مفاتيح Gemini. يرجى المحاولة لاحقاً."
        : errMsg,
      success: false,
    });
  }
});

// Status endpoint to check which key is active (index only, never expose key value)
router.get("/gemini/status", (_req, res) => {
  const usingEnv = !!process.env.GEMINI_API_KEY;
  res.json({
    keysAvailable: usingEnv ? 1 : BUILTIN_KEYS.length,
    currentKeyIndex: usingEnv ? "env" : currentKeyIndex,
    model: "gemini-2.5-flash",
    status: "ready",
  });
});

export default router;
