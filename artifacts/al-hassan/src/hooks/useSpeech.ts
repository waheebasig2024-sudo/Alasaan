/**
 * useSpeech — نظام TTS مدمج داخل التطبيق
 *
 * الأولوية:
 * 1. Gemini TTS API (صوت حقيقي عالي الجودة من الخادم)
 * 2. expo-speech fallback (TTS الهاتف كاحتياط)
 */
import { useCallback, useRef, useState } from "react";
import { Platform } from "react-native";
import * as Speech from "expo-speech";
import * as FileSystem from "expo-file-system/legacy";
import { Audio } from "expo-av";
import Constants from "expo-constants";

interface SpeakOptions {
  gender?: "male" | "female";
  rate?: number;
  onDone?: () => void;
}

// ── تحديد URL الخادم ─────────────────────────────────────────

function resolveApiBase(): string | null {
  try {
    const extra = (Constants.expoConfig?.extra as Record<string, unknown>) ?? {};
    const domain = (extra.apiDomain as string) || process.env.EXPO_PUBLIC_DOMAIN || "";
    if (!domain) return null;
    const clean = domain.replace(/^https?:\/\//, "").replace(/\/+$/, "");
    return `https://${clean}/api`;
  } catch {
    return null;
  }
}

// ── تقسيم النص لجمل قصيرة (أقل من 500 حرف) ──────────────────

function splitToSentences(text: string): string[] {
  const raw = text
    .split(/(?<=[.!?؟\n])\s+|(?<=[\u060C\u061B])\s{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";

  for (const sentence of raw) {
    if ((current + " " + sentence).length > 480) {
      if (current) chunks.push(current.trim());
      current = sentence;
    } else {
      current = current ? current + " " + sentence : sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  return chunks.length > 0 ? chunks : [text.substring(0, 500)];
}

// ── استدعاء Gemini TTS API ───────────────────────────────────

async function fetchTtsAudio(
  text: string,
  apiBase: string
): Promise<{ audio: string; mimeType: string } | null> {
  try {
    const res = await fetch(`${apiBase}/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice: "Orus" }),
      signal: AbortSignal.timeout(25_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      audio?: string;
      mimeType?: string;
      success?: boolean;
    };
    if (!data.success || !data.audio) return null;
    return { audio: data.audio, mimeType: data.mimeType ?? "audio/wav" };
  } catch {
    return null;
  }
}

// ── تشغيل ملف صوتي base64 مع expo-av ────────────────────────

async function playBase64Audio(
  base64: string,
  mimeType: string,
  onDone: () => void
): Promise<Audio.Sound | null> {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    const ext = mimeType.includes("wav") ? "wav" : "mp3";
    const uri = `${FileSystem.cacheDirectory}tts_${Date.now()}.${ext}`;

    await FileSystem.writeAsStringAsync(uri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true, volume: 1.0 }
    );

    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
        FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
        onDone();
      }
    });

    return sound;
  } catch {
    onDone();
    return null;
  }
}

// ── expo-speech fallback ──────────────────────────────────────

async function speakWithFallback(
  text: string,
  onDone: () => void
): Promise<void> {
  try {
    const voices = await Speech.getAvailableVoicesAsync().catch(() => []);
    const arabicVoices = voices.filter(
      (v) => v.language?.startsWith("ar") || v.identifier?.toLowerCase().includes("ar")
    );
    const best = arabicVoices.find((v) =>
      ["enhanced", "premium", "neural"].some(
        (q) => v.identifier?.toLowerCase().includes(q) || v.name?.toLowerCase().includes(q)
      )
    ) ?? arabicVoices[0];

    Speech.speak(text, {
      language: best?.language ?? "ar-SA",
      voice: best?.identifier,
      pitch: 0.95,
      rate: 0.88,
      onDone,
      onStopped: onDone,
      onError: () => {
        Speech.speak(text, { language: "ar", pitch: 0.95, rate: 0.88, onDone, onStopped: onDone, onError: onDone });
      },
    });
  } catch {
    onDone();
  }
}

// ── Hook الرئيسي ──────────────────────────────────────────────

export function useSpeech() {
  const [isSpeakingState, setIsSpeakingState] = useState(false);
  const isSpeakingRef = useRef(false);
  const stoppedRef = useRef(false);
  const currentSoundRef = useRef<Audio.Sound | null>(null);

  const setActive = (val: boolean) => {
    isSpeakingRef.current = val;
    setIsSpeakingState(val);
  };

  const speak = useCallback(
    async (text: string, options: SpeakOptions = {}) => {
      if (Platform.OS === "web") return;
      if (!text?.trim()) return;

      // وقف أي صوت سابق
      stoppedRef.current = false;
      await Speech.stop().catch(() => {});
      if (currentSoundRef.current) {
        await currentSoundRef.current.stopAsync().catch(() => {});
        await currentSoundRef.current.unloadAsync().catch(() => {});
        currentSoundRef.current = null;
      }

      setActive(true);

      const apiBase = resolveApiBase();
      const onAllDone = () => {
        setActive(false);
        options.onDone?.();
      };

      // ── الطريقة 1: Gemini TTS عبر API ──────────────────────
      if (apiBase) {
        const sentences = splitToSentences(text);
        let index = 0;

        const playNext = async () => {
          if (stoppedRef.current || index >= sentences.length) {
            onAllDone();
            return;
          }

          const chunk = sentences[index++];
          const result = await fetchTtsAudio(chunk, apiBase);

          if (stoppedRef.current) { onAllDone(); return; }

          if (result) {
            const sound = await playBase64Audio(result.audio, result.mimeType, playNext);
            currentSoundRef.current = sound;
          } else {
            // إذا فشل TTS الخادم لهذه الجملة، اقرأها بـ expo-speech
            await new Promise<void>((resolve) => {
              Speech.speak(chunk, {
                language: "ar-SA",
                pitch: 0.95,
                rate: 0.88,
                onDone: resolve,
                onStopped: resolve,
                onError: () => resolve(),
              });
            });
            if (!stoppedRef.current) await playNext();
          }
        };

        await playNext();
        return;
      }

      // ── الطريقة 2: expo-speech (احتياط بدون خادم) ─────────
      await speakWithFallback(text, onAllDone);
    },
    []
  );

  const stop = useCallback(async () => {
    stoppedRef.current = true;
    await Speech.stop().catch(() => {});
    if (currentSoundRef.current) {
      await currentSoundRef.current.stopAsync().catch(() => {});
      await currentSoundRef.current.unloadAsync().catch(() => {});
      currentSoundRef.current = null;
    }
    setActive(false);
  }, []);

  const isSpeaking = () => isSpeakingRef.current;

  return { speak, stop, isSpeaking, isSpeakingState };
}
