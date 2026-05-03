// ============================================================
// Hassan TTS Service — صوت الحسن من خادم Aiden
// الأولوية القصوى: Aiden /api/tts → expo-av
// يدعم: MP3 · WAV · Opus · AAC
// ============================================================

import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../constants/storage-keys";

export type VoiceMode = "aiden_tts" | "gemini" | "system";

export interface TtsRequest {
  text: string;
  tone?: "calm" | "alert" | "urgent" | "success" | "thinking";
  speed?: number;
  pitch?: number;
}

export interface TtsAudioResult {
  base64: string;
  mimeType: string;
  source: VoiceMode;
}

// ── Active sound ref (singleton) ─────────────────────────────

let _activeSound: Audio.Sound | null = null;

async function stopActiveSound(): Promise<void> {
  if (_activeSound) {
    try {
      await _activeSound.stopAsync();
      await _activeSound.unloadAsync();
    } catch { /* ignore */ }
    _activeSound = null;
  }
}

// ── Get server URL from storage ───────────────────────────────

export async function getAidenServerUrl(): Promise<string | null> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.AIDEN_SERVER_URL);
    if (stored && stored.startsWith("http")) return stored.replace(/\/$/, "");
    return null;
  } catch {
    return null;
  }
}

// ── Aiden Server TTS (Priority #0) ───────────────────────────
// POST /api/tts → returns audio/mp3 or application/json with base64

export async function fetchAidenTTS(
  text: string,
  serverUrl: string,
  options: Pick<TtsRequest, "tone" | "speed" | "pitch"> = {}
): Promise<TtsAudioResult | null> {
  const base = serverUrl.replace(/\/$/, "");
  const endpoint = `${base}/api/tts`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: text.slice(0, 800),
        tone: options.tone ?? "calm",
        speed: options.speed ?? 1.0,
        pitch: options.pitch ?? 1.0,
        voice: "hassan",
        language: "ar",
        format: "mp3",
      }),
      signal: AbortSignal.timeout(12_000),
    });

    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") ?? "";

    // ── Case 1: Server returns raw audio binary ───────────────
    if (
      contentType.includes("audio/") ||
      contentType.includes("application/octet-stream")
    ) {
      const buffer = await res.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      const b64 = btoa(binary);

      const mimeType = contentType.includes("wav")
        ? "audio/wav"
        : contentType.includes("opus")
        ? "audio/ogg"
        : "audio/mp3";

      return { base64: b64, mimeType, source: "aiden_tts" };
    }

    // ── Case 2: Server returns JSON with base64 field ─────────
    if (contentType.includes("application/json")) {
      const data = (await res.json()) as {
        audio?: string;
        data?: string;
        mimeType?: string;
        mime_type?: string;
        success?: boolean;
        format?: string;
      };

      const audio = data.audio ?? data.data;
      if (!audio) return null;

      const mime =
        data.mimeType ??
        data.mime_type ??
        (data.format === "wav" ? "audio/wav" : "audio/mp3");

      return { base64: audio, mimeType: mime, source: "aiden_tts" };
    }

    return null;
  } catch {
    return null;
  }
}

// ── Play base64 audio with expo-av ───────────────────────────

export async function playTtsAudio(
  result: TtsAudioResult,
  onDone: () => void
): Promise<Audio.Sound | null> {
  try {
    await stopActiveSound();

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: false,
    });

    const ext = result.mimeType.includes("wav")
      ? "wav"
      : result.mimeType.includes("ogg") || result.mimeType.includes("opus")
      ? "ogg"
      : "mp3";

    const uri = `${FileSystem.cacheDirectory}hassan_tts_${Date.now()}.${ext}`;

    await FileSystem.writeAsStringAsync(uri, result.base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true, volume: 1.0 }
    );

    _activeSound = sound;

    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
        FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
        _activeSound = null;
        onDone();
      }
    });

    return sound;
  } catch {
    onDone();
    return null;
  }
}

// ── Stop all Hassan audio ─────────────────────────────────────

export function stopHassanAudio(): void {
  stopActiveSound().catch(() => {});
}

// ── Test TTS endpoint ─────────────────────────────────────────

export async function testAidenTTS(serverUrl: string): Promise<{
  ok: boolean;
  latencyMs?: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    const result = await fetchAidenTTS("مرحباً", serverUrl, { tone: "calm" });
    if (result) {
      return { ok: true, latencyMs: Date.now() - start };
    }
    return { ok: false, error: "لم يُعد خادم Aiden صوتاً صالحاً" };
  } catch (e: unknown) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "خطأ في الاتصال",
    };
  }
}
