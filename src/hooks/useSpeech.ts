/**
 * useSpeech — نظام TTS رباعي الطبقات لصوت الحسن
 *
 * الأولوية:
 * 0. Aiden Server TTS  — صوت الحسن من الخادم المحلي (expo-av)
 * 1. Gemini TTS مباشرة — من مفاتيح التطبيق (expo-av)
 * 2. Gemini TTS عبر API Server (expo-av)
 * 3. expo-speech       — احتياط طارئ فقط
 *
 * expo-speech مُعطَّل بشكل افتراضي ما لم تُفعَّل صراحةً
 */

import { useCallback, useRef, useState } from "react";
import { Platform } from "react-native";
import * as Speech from "expo-speech";
import * as FileSystem from "expo-file-system/legacy";
import { Audio } from "expo-av";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../constants/storage-keys";
import {
  fetchAidenTTS,
  playTtsAudio,
} from "../services/hassan-tts.service";

interface SpeakOptions {
  gender?: "male" | "female";
  rate?: number;
  /** اضبط true فقط إن أردت expo-speech كاحتياط نهائي */
  allowSystemTts?: boolean;
  onDone?: () => void;
}

// ── Read server URL from AsyncStorage ────────────────────────

async function loadServerUrl(): Promise<string | null> {
  try {
    const v = await AsyncStorage.getItem(STORAGE_KEYS.AIDEN_SERVER_URL);
    if (v && v.startsWith("http")) return v.replace(/\/$/, "");
    return null;
  } catch {
    return null;
  }
}

// ── Resolve API base from expo config ─────────────────────────

function resolveApiBase(): string | null {
  try {
    const extra = (Constants.expoConfig?.extra as Record<string, unknown>) ?? {};
    const domain = (extra.apiDomain as string) || "";
    if (!domain) return null;
    const clean = domain.replace(/^https?:\/\//, "").replace(/\/+$/, "");
    return `https://${clean}/api`;
  } catch {
    return null;
  }
}

// ── Gemini keys embedded in app ───────────────────────────────

function getClientGeminiKeys(): string[] {
  return [
    process.env.EXPO_PUBLIC_GEMINI_KEY_1,
    process.env.EXPO_PUBLIC_GEMINI_KEY_2,
    process.env.EXPO_PUBLIC_GEMINI_KEY_3,
  ].filter((k): k is string => typeof k === "string" && k.length > 10);
}

// ── Split long text into ≤480-char sentence chunks ──────────

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

// ── PCM → WAV converter ──────────────────────────────────────

function pcmBase64ToWavBase64(pcmBase64: string, sampleRate = 24000): string {
  const pcmBytes = Uint8Array.from(atob(pcmBase64), (c) => c.charCodeAt(0));
  const dataLength = pcmBytes.length;
  const wav = new Uint8Array(44 + dataLength);
  const view = new DataView(wav.buffer);
  const enc = new TextEncoder();
  wav.set(enc.encode("RIFF"), 0);
  view.setUint32(4, 36 + dataLength, true);
  wav.set(enc.encode("WAVE"), 8);
  wav.set(enc.encode("fmt "), 12);
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, (sampleRate * 1 * 16) / 8, true);
  view.setUint16(32, (1 * 16) / 8, true);
  view.setUint16(34, 16, true);
  wav.set(enc.encode("data"), 36);
  view.setUint32(40, dataLength, true);
  wav.set(pcmBytes, 44);
  let binary = "";
  for (let i = 0; i < wav.length; i++) binary += String.fromCharCode(wav[i]);
  return btoa(binary);
}

// ── Gemini TTS — direct from app ─────────────────────────────

async function callGeminiTtsDirect(
  text: string
): Promise<{ audio: string; mimeType: string } | null> {
  const keys = getClientGeminiKeys();
  if (keys.length === 0) return null;

  const GEMINI_TTS_MODEL = "gemini-2.5-flash-preview-tts";
  const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

  for (const key of keys) {
    try {
      const url = `${GEMINI_API_BASE}/models/${GEMINI_TTS_MODEL}:generateContent?key=${key}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: "Orus" } },
            },
          },
        }),
        signal: AbortSignal.timeout(28_000),
      });

      if (!res.ok) {
        if (res.status === 429 || res.status === 503) continue;
        return null;
      }

      const data = await res.json() as {
        candidates?: Array<{
          content?: { parts?: Array<{ inlineData?: { mimeType?: string; data?: string } }> };
        }>;
      };

      const inlineData = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
      if (!inlineData?.data) continue;

      const mimeType = inlineData.mimeType ?? "audio/pcm;rate=24000";
      const rateMatch = mimeType.match(/rate=(\d+)/);
      const sampleRate = rateMatch ? parseInt(rateMatch[1]) : 24000;
      return { audio: pcmBase64ToWavBase64(inlineData.data, sampleRate), mimeType: "audio/wav" };
    } catch {
      continue;
    }
  }
  return null;
}

// ── Gemini TTS — via API server ───────────────────────────────

async function callGeminiTtsServer(
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
    const data = (await res.json()) as { audio?: string; mimeType?: string; success?: boolean };
    if (!data.success || !data.audio) return null;
    return { audio: data.audio, mimeType: data.mimeType ?? "audio/wav" };
  } catch {
    return null;
  }
}

// ── Play base64 audio via expo-av ────────────────────────────

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

    const ext = mimeType.includes("wav") ? "wav" : mimeType.includes("ogg") ? "ogg" : "mp3";
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

// ── Hook الرئيسي ─────────────────────────────────────────────

export function useSpeech() {
  const [isSpeakingState, setIsSpeakingState] = useState(false);
  const isSpeakingRef = useRef(false);
  const stoppedRef = useRef(false);
  const currentSoundRef = useRef<Audio.Sound | null>(null);

  const setActive = (val: boolean) => {
    isSpeakingRef.current = val;
    setIsSpeakingState(val);
  };

  const speak = useCallback(async (text: string, options: SpeakOptions = {}) => {
    if (Platform.OS === "web") return;
    if (!text?.trim()) return;

    stoppedRef.current = false;

    // وقف أي صوت سابق
    await Speech.stop().catch(() => {});
    if (currentSoundRef.current) {
      await currentSoundRef.current.stopAsync().catch(() => {});
      await currentSoundRef.current.unloadAsync().catch(() => {});
      currentSoundRef.current = null;
    }

    setActive(true);

    const aidenUrl = await loadServerUrl();
    const apiBase = resolveApiBase();

    const onAllDone = () => {
      setActive(false);
      options.onDone?.();
    };

    const sentences = splitToSentences(text);
    let index = 0;

    const playNext = async (): Promise<void> => {
      if (stoppedRef.current || index >= sentences.length) {
        onAllDone();
        return;
      }

      const chunk = sentences[index++];

      // ── Layer 0: Aiden Server TTS (صوت الحسن الحقيقي) ───────
      if (aidenUrl) {
        const aidenResult = await fetchAidenTTS(chunk, aidenUrl, {
          tone: "calm",
          speed: options.rate ?? 1.0,
        });
        if (stoppedRef.current) { onAllDone(); return; }

        if (aidenResult) {
          const sound = await playTtsAudio(aidenResult, playNext);
          currentSoundRef.current = sound;
          return;
        }
      }

      // ── Layer 1: Gemini TTS مباشرة من التطبيق ──────────────
      const direct = await callGeminiTtsDirect(chunk);
      if (stoppedRef.current) { onAllDone(); return; }

      if (direct) {
        const sound = await playBase64Audio(direct.audio, direct.mimeType, playNext);
        currentSoundRef.current = sound;
        return;
      }

      // ── Layer 2: Gemini TTS عبر API Server ────────────────
      if (apiBase) {
        const server = await callGeminiTtsServer(chunk, apiBase);
        if (stoppedRef.current) { onAllDone(); return; }

        if (server) {
          const sound = await playBase64Audio(server.audio, server.mimeType, playNext);
          currentSoundRef.current = sound;
          return;
        }
      }

      // ── Layer 3: expo-speech احتياط طارئ (معطَّل افتراضياً) ─
      if (options.allowSystemTts) {
        await new Promise<void>((resolve) => {
          Speech.speak(chunk, {
            language: "ar-SA",
            pitch: 0.92,
            rate: 0.85,
            onDone: resolve,
            onStopped: resolve,
            onError: () => resolve(),
          });
        });
        if (!stoppedRef.current) await playNext();
      } else {
        // لا صوت — انتقل للجملة التالية
        await playNext();
      }
    };

    await playNext();
  }, []);

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
