/**
 * TTS Route — توليد صوت حقيقي من Gemini Audio API
 * يستقبل نصاً عربياً ويعيد ملف WAV بـ base64
 */
import { Router } from "express";
import { logger } from "../lib/logger";

const router = Router();

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const TTS_MODEL = "gemini-2.5-flash-preview-tts";

function getGeminiKeys(): string[] {
  return [
    process.env.EXPO_PUBLIC_GEMINI_KEY_1 ?? process.env.GEMINI_KEY_1,
    process.env.EXPO_PUBLIC_GEMINI_KEY_2 ?? process.env.GEMINI_KEY_2,
    process.env.EXPO_PUBLIC_GEMINI_KEY_3 ?? process.env.GEMINI_KEY_3,
  ].filter((k): k is string => typeof k === "string" && k.length > 10);
}

/**
 * يحوّل PCM raw audio (base64) إلى WAV (base64)
 * Gemini يُعيد LINEAR16 PCM بمعدل 24000 Hz
 */
function pcmBase64ToWavBase64(pcmBase64: string, sampleRate = 24000): string {
  const pcm = Buffer.from(pcmBase64, "base64");
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataLength = pcm.length;

  const wav = Buffer.alloc(44 + dataLength);

  // RIFF chunk descriptor
  wav.write("RIFF", 0, "ascii");
  wav.writeUInt32LE(36 + dataLength, 4);
  wav.write("WAVE", 8, "ascii");

  // fmt sub-chunk
  wav.write("fmt ", 12, "ascii");
  wav.writeUInt32LE(16, 16);          // Subchunk1Size (PCM=16)
  wav.writeUInt16LE(1, 20);           // AudioFormat (PCM=1)
  wav.writeUInt16LE(numChannels, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(byteRate, 28);
  wav.writeUInt16LE(blockAlign, 32);
  wav.writeUInt16LE(bitsPerSample, 34);

  // data sub-chunk
  wav.write("data", 36, "ascii");
  wav.writeUInt32LE(dataLength, 40);
  pcm.copy(wav, 44);

  return wav.toString("base64");
}

router.post("/tts", async (req, res) => {
  try {
    const { text, voice = "Orus" } = req.body as { text?: string; voice?: string };

    if (!text || typeof text !== "string" || !text.trim()) {
      res.status(400).json({ error: "النص مطلوب", success: false });
      return;
    }

    const trimmed = text.trim().substring(0, 4500);
    const keys = getGeminiKeys();

    if (keys.length === 0) {
      res.status(503).json({
        error: "لا توجد مفاتيح Gemini مهيأة على الخادم",
        success: false,
      });
      return;
    }

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      try {
        const url = `${GEMINI_API_BASE}/models/${TTS_MODEL}:generateContent?key=${key}`;

        const body = {
          contents: [{ parts: [{ text: trimmed }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voice },
              },
            },
          },
        };

        logger.info({ keyIndex: i + 1, textLength: trimmed.length, voice }, "Calling Gemini TTS");

        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(30_000),
        });

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({})) as Record<string, unknown>;
          const errMsg = ((errBody as { error?: { message?: string } })?.error?.message) ?? "";
          logger.warn({ status: response.status, errMsg, keyIndex: i + 1 }, "Gemini TTS key rejected");
          if (response.status === 429 || response.status === 503) continue;
          throw new Error(`TTS HTTP ${response.status}: ${errMsg}`);
        }

        const data = await response.json() as {
          candidates?: Array<{
            content?: {
              parts?: Array<{
                inlineData?: { mimeType?: string; data?: string };
              }>;
            };
          }>;
        };

        const inlineData = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData;

        if (!inlineData?.data) {
          throw new Error("Gemini TTS: لم يُعَد أي صوت");
        }

        const mimeType = inlineData.mimeType ?? "audio/pcm;rate=24000";
        const rateMatch = mimeType.match(/rate=(\d+)/);
        const sampleRate = rateMatch ? parseInt(rateMatch[1]) : 24000;

        const wavBase64 = pcmBase64ToWavBase64(inlineData.data, sampleRate);

        logger.info({ keyIndex: i + 1, wavSizeKb: Math.round(wavBase64.length * 0.75 / 1024) }, "TTS generated successfully");

        res.json({ audio: wavBase64, mimeType: "audio/wav", success: true });
        return;
      } catch (err) {
        const msg = err instanceof Error ? err.message.toLowerCase() : String(err);
        logger.warn({ err, keyIndex: i + 1 }, "TTS key error");
        if (
          msg.includes("429") ||
          msg.includes("503") ||
          msg.includes("quota") ||
          msg.includes("rate") ||
          msg.includes("timeout") ||
          msg.includes("abort")
        ) {
          continue;
        }
        throw err;
      }
    }

    res.status(503).json({
      error: "تعذّر توليد الصوت — جميع مفاتيح Gemini فشلت أو استنفذت",
      success: false,
    });
  } catch (error: unknown) {
    logger.error({ err: error }, "TTS route error");
    res.status(500).json({
      error: error instanceof Error ? error.message : "خطأ غير متوقع في توليد الصوت",
      success: false,
    });
  }
});

export default router;
