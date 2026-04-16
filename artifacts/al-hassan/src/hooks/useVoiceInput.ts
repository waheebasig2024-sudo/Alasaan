import { useState } from "react";
import { Platform } from "react-native";

// Voice input via expo-speech requires a native build for full support.
// This hook provides a web-compatible stub.
// TODO: Implement with expo-av + speech recognition in full native build.

export function useVoiceInput() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  const startListening = async (): Promise<void> => {
    if (Platform.OS === "web" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition =
        (window as unknown as { webkitSpeechRecognition: new () => SpeechRecognition }).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = "ar-SA";
      recognition.onresult = (e: SpeechRecognitionEvent) => {
        setTranscript(e.results[0][0].transcript);
      };
      recognition.onend = () => setIsListening(false);
      setIsListening(true);
      recognition.start();
      return;
    }

    // TODO: Native implementation with expo-av
    setIsListening(false);
  };

  const stopListening = () => {
    setIsListening(false);
  };

  return { isListening, transcript, startListening, stopListening };
}
