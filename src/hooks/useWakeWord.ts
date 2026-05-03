import { useState, useRef, useCallback } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { useVoiceRecorder, isAudioLocked, getAudioLockOwner } from "./useVoiceRecorder";

const WAKE_WORDS = [
  "يا الحسن",
  "يا حسن",
  "الحسن",
  "حسن",
  "هاي الحسن",
  "hey hassan",
  "hassan",
];

// Record 3s chunks — long enough to catch the wake word clearly
const CHUNK_DURATION_MS = 3000;
// If mic is busy (manual recording), wait this long before retrying
const LOCK_RETRY_MS = 800;
// Max consecutive failures before giving up
const MAX_FAILURES = 4;

const FOREGROUND_NOTIF_ID = "wake-word-foreground";

function containsWakeWord(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return WAKE_WORDS.some((w) => normalized.includes(w.toLowerCase()));
}

async function showForegroundNotification(): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: FOREGROUND_NOTIF_ID,
      content: {
        title: "الحسن يستمع...",
        body: 'قل "يا الحسن" لتنشيطه',
        sticky: true,
        autoDismiss: false,
        priority: Notifications.AndroidNotificationPriority.LOW,
        color: "#C9A84C",
      },
      trigger: null,
    });
  } catch {}
}

async function dismissForegroundNotification(): Promise<void> {
  try {
    await Notifications.dismissNotificationAsync(FOREGROUND_NOTIF_ID);
    await Notifications.cancelScheduledNotificationAsync(FOREGROUND_NOTIF_ID);
  } catch {}
}

interface UseWakeWordOptions {
  onActivated: (partialTranscript?: string) => void;
  onError?: (error: string) => void;
}

export function useWakeWord({ onActivated, onError }: UseWakeWordOptions) {
  const [isWatching, setIsWatching] = useState(false);
  const [lastHeard, setLastHeard] = useState("");
  const activeRef = useRef(false);
  const failureCountRef = useRef(0);

  const {
    lockId,
    startRecording,
    stopRecording,
    transcribeAudio,
    requestMicPermission,
  } = useVoiceRecorder();

  const recordChunk = useCallback(async () => {
    if (!activeRef.current) return;

    // If the mic is locked by someone else (manual recording), wait and retry
    if (isAudioLocked() && getAudioLockOwner() !== lockId) {
      if (activeRef.current) {
        setTimeout(recordChunk, LOCK_RETRY_MS);
      }
      return;
    }

    try {
      const started = await startRecording();

      if (!started) {
        failureCountRef.current += 1;

        if (failureCountRef.current >= MAX_FAILURES) {
          // Too many consecutive failures — stop silently
          activeRef.current = false;
          setIsWatching(false);
          await dismissForegroundNotification();
          onError?.("توقف الاستماع بسبب خطأ متكرر في المايكروفون");
          return;
        }

        // Transient failure — wait a bit and retry without showing an error
        if (activeRef.current) {
          setTimeout(recordChunk, LOCK_RETRY_MS);
        }
        return;
      }

      // Recording started successfully — reset failure counter
      failureCountRef.current = 0;

      // Wait for the chunk duration
      await new Promise<void>((res) => setTimeout(res, CHUNK_DURATION_MS));

      // Check if we were stopped during recording
      if (!activeRef.current) {
        await stopRecording();
        return;
      }

      const uri = await stopRecording();

      if (!activeRef.current) return;

      if (uri) {
        const text = await transcribeAudio(uri);
        if (text) setLastHeard(text);

        if (containsWakeWord(text)) {
          activeRef.current = false;
          setIsWatching(false);
          await dismissForegroundNotification();
          // Small pause to let audio session fully release before manual mic starts
          await new Promise<void>((res) => setTimeout(res, 300));
          onActivated(text);
          return;
        }
      }
    } catch {
      // Unexpected error — don't crash the loop, just retry
      failureCountRef.current += 1;
    }

    // Continue the loop
    if (activeRef.current) {
      setTimeout(recordChunk, 100);
    } else {
      setIsWatching(false);
      await dismissForegroundNotification();
    }
  }, [lockId, startRecording, stopRecording, transcribeAudio, onActivated, onError]);

  const startWatching = useCallback(async () => {
    if (Platform.OS === "web") {
      onError?.("كشف كلمة التنبيه غير مدعوم على الويب");
      return;
    }
    if (activeRef.current) return; // Already watching

    const granted = await requestMicPermission();
    if (!granted) {
      onError?.("يرجى منح إذن المايكروفون");
      return;
    }

    if (Platform.OS === "android") {
      await showForegroundNotification();
    }

    failureCountRef.current = 0;
    activeRef.current = true;
    setIsWatching(true);
    setLastHeard("");
    recordChunk();
  }, [requestMicPermission, recordChunk, onError]);

  const stopWatching = useCallback(async () => {
    activeRef.current = false;
    setIsWatching(false);
    await dismissForegroundNotification();
    try {
      await stopRecording();
    } catch {}
  }, [stopRecording]);

  return {
    isWatching,
    lastHeard,
    startWatching,
    stopWatching,
  };
}
