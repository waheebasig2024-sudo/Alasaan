import * as Speech from "expo-speech";
import { Platform } from "react-native";

export interface SpeechOptions {
  language?: string;
  pitch?: number;
  rate?: number;
}

export async function speak(text: string, options: SpeechOptions = {}): Promise<void> {
  const { language = "ar-SA", pitch = 1.0, rate = 0.9 } = options;
  if (Platform.OS === "web") {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.pitch = pitch;
    utterance.rate = rate;
    window.speechSynthesis.speak(utterance);
    return;
  }
  await Speech.speak(text, { language, pitch, rate });
}

export function stopSpeaking(): void {
  if (Platform.OS === "web") {
    window.speechSynthesis.cancel();
    return;
  }
  Speech.stop();
}

export function isSpeaking(): boolean {
  if (Platform.OS === "web") return window.speechSynthesis.speaking;
  return false;
}
