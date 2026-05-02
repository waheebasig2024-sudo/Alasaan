import { useCallback, useRef, useState } from "react";
import { Platform } from "react-native";
import * as Speech from "expo-speech";

interface SpeakOptions {
  gender?: "male" | "female";
  rate?: number;
  onDone?: () => void;
}

const AR_LOCALES = ["ar-SA", "ar-YE", "ar-EG", "ar"];

async function getBestArabicVoice(): Promise<{ id: string | undefined; locale: string }> {
  try {
    const voices = await Speech.getAvailableVoicesAsync();

    const arabicVoices = voices.filter(
      (v) =>
        v.language?.startsWith("ar") ||
        v.identifier?.toLowerCase().includes("ar")
    );

    if (arabicVoices.length === 0) return { id: undefined, locale: "ar-SA" };

    // Quality priority: prefer network/enhanced voices, then local
    const qualityKeywords = ["enhanced", "premium", "neural", "compact"];
    const networkVoice = arabicVoices.find((v) =>
      qualityKeywords.some((q) =>
        v.identifier?.toLowerCase().includes(q) ||
        v.name?.toLowerCase().includes(q)
      )
    );
    if (networkVoice) {
      return { id: networkVoice.identifier, locale: networkVoice.language ?? "ar-SA" };
    }

    // Locale priority
    for (const locale of AR_LOCALES) {
      const match = arabicVoices.find((v) => v.language === locale);
      if (match) return { id: match.identifier, locale: match.language ?? locale };
    }

    const first = arabicVoices[0];
    return { id: first.identifier, locale: first.language ?? "ar" };
  } catch {
    return { id: undefined, locale: "ar-SA" };
  }
}

export function useSpeech() {
  const [isSpeakingState, setIsSpeakingState] = useState(false);
  const isSpeakingRef = useRef(false);
  const onDoneCallbackRef = useRef<(() => void) | undefined>(undefined);

  const speak = useCallback(
    async (text: string, options: SpeakOptions = {}) => {
      if (Platform.OS === "web") return;
      if (!text?.trim()) return;

      try {
        await Speech.stop();
        isSpeakingRef.current = true;
        setIsSpeakingState(true);
        onDoneCallbackRef.current = options.onDone;

        const pitch = options.gender === "female" ? 1.1 : 0.95;
        const rate = options.rate ?? (options.gender === "female" ? 0.9 : 0.88);

        const { id: voiceId, locale } =
          Platform.OS === "android"
            ? await getBestArabicVoice()
            : { id: undefined, locale: "ar-SA" };

        const handleDone = () => {
          isSpeakingRef.current = false;
          setIsSpeakingState(false);
          onDoneCallbackRef.current?.();
          onDoneCallbackRef.current = undefined;
        };

        Speech.speak(text, {
          language: locale,
          voice: voiceId,
          pitch,
          rate,
          onStart: () => {
            isSpeakingRef.current = true;
            setIsSpeakingState(true);
          },
          onDone: handleDone,
          onStopped: handleDone,
          onError: () => {
            // Retry with generic Arabic if voice fails
            isSpeakingRef.current = true;
            Speech.speak(text, {
              language: "ar",
              pitch: 0.95,
              rate: 0.88,
              onDone: handleDone,
              onStopped: handleDone,
              onError: () => {
                isSpeakingRef.current = false;
                setIsSpeakingState(false);
                onDoneCallbackRef.current?.();
                onDoneCallbackRef.current = undefined;
              },
            });
          },
        });
      } catch {
        isSpeakingRef.current = false;
        setIsSpeakingState(false);
      }
    },
    []
  );

  const stop = useCallback(async () => {
    try {
      await Speech.stop();
      isSpeakingRef.current = false;
      setIsSpeakingState(false);
      onDoneCallbackRef.current = undefined;
    } catch {}
  }, []);

  const isSpeaking = () => isSpeakingRef.current;

  return { speak, stop, isSpeaking, isSpeakingState };
}
