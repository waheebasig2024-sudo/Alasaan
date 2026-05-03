// ============================================================
// Emotional Audio Service — نظام الصوت العاطفي
// يضبط نبرة الصوت حسب حالة النظام والأحداث
// ============================================================

import { Audio } from "expo-av";

export type EmotionalTone = "calm" | "alert" | "urgent" | "success" | "thinking";

export interface AudioFeedbackConfig {
  tone: EmotionalTone;
  text?: string;
  serverUrl?: string;
}

// ── Tone beep frequencies (Hz) using data URIs ───────────────
// نستخدم TTS من Aiden إن كان متاحاً، وإلا نستخدم Audio system

let activeSound: Audio.Sound | null = null;

async function stopCurrent(): Promise<void> {
  if (activeSound) {
    try {
      await activeSound.stopAsync();
      await activeSound.unloadAsync();
    } catch { /* ignore */ }
    activeSound = null;
  }
}

// ── TTS with emotional context ────────────────────────────────

export async function playEmotionalTTS(
  text: string,
  tone: EmotionalTone,
  serverUrl?: string
): Promise<void> {
  await stopCurrent();

  if (!serverUrl) return;

  const base = serverUrl.replace(/\/$/, "");
  const tonePrefix = getTonePrefix(tone);
  const enhancedText = `${tonePrefix}${text}`;

  try {
    const res = await fetch(`${base}/api/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: enhancedText.slice(0, 500),
        tone,
        speed: getToneSpeed(tone),
        pitch: getTonePitch(tone),
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return;

    const blob = await res.blob();
    const reader = new FileReader();

    await new Promise<void>((resolve) => {
      reader.onloadend = async () => {
        try {
          const uri = reader.result as string;
          await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
          });
          const { sound } = await Audio.Sound.createAsync({ uri });
          activeSound = sound;
          await sound.playAsync();
          sound.setOnPlaybackStatusUpdate((s) => {
            if ("didJustFinish" in s && s.didJustFinish) {
              sound.unloadAsync().catch(() => {});
              activeSound = null;
              resolve();
            }
          });
        } catch { resolve(); }
      };
      reader.readAsDataURL(blob);
    });
  } catch { /* audio is optional */ }
}

// ── Helper functions ─────────────────────────────────────────

function getTonePrefix(tone: EmotionalTone): string {
  switch (tone) {
    case "urgent": return "⚠ تنبيه عاجل: ";
    case "alert": return "تنبيه: ";
    case "success": return "ممتاز! ";
    case "thinking": return "";
    case "calm": return "";
    default: return "";
  }
}

function getToneSpeed(tone: EmotionalTone): number {
  switch (tone) {
    case "urgent": return 1.2;
    case "alert": return 1.1;
    case "thinking": return 0.9;
    case "success": return 1.0;
    case "calm": return 0.95;
    default: return 1.0;
  }
}

function getTonePitch(tone: EmotionalTone): number {
  switch (tone) {
    case "urgent": return 1.2;
    case "alert": return 1.1;
    case "success": return 1.1;
    case "thinking": return 0.9;
    case "calm": return 1.0;
    default: return 1.0;
  }
}

// ── Event-based audio feedback ────────────────────────────────

export async function playFeedback(config: AudioFeedbackConfig): Promise<void> {
  if (config.text && config.serverUrl) {
    await playEmotionalTTS(config.text, config.tone, config.serverUrl);
    return;
  }

  // Fallback: play system-level audio cue using short tones
  // (Expo doesn't support tone generation directly, so we skip if no TTS)
}

// ── Determine tone from context ───────────────────────────────

export function determineTone(context: {
  hasThreats?: boolean;
  cpuHigh?: boolean;
  newDevice?: boolean;
  isError?: boolean;
  isSuccess?: boolean;
  isProcessing?: boolean;
}): EmotionalTone {
  if (context.hasThreats) return "urgent";
  if (context.newDevice) return "alert";
  if (context.cpuHigh) return "alert";
  if (context.isError) return "alert";
  if (context.isSuccess) return "success";
  if (context.isProcessing) return "thinking";
  return "calm";
}

export function stopAudio(): void {
  stopCurrent().catch(() => {});
}
