import { useState, useRef, useCallback } from "react";
import { Platform } from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";

// ─── Global Audio Lock ─────────────────────────────────────────────────────
// Android allows only ONE active recording session at a time.
// This module-level lock prevents two callers from recording simultaneously.
// wake-word and manual recording both use this lock before creating a session.
let _audioLockOwner: string | null = null;

export function tryAcquireAudioLock(owner: string): boolean {
  if (_audioLockOwner !== null && _audioLockOwner !== owner) return false;
  _audioLockOwner = owner;
  return true;
}

export function releaseAudioLock(owner: string): void {
  if (_audioLockOwner === owner) _audioLockOwner = null;
}

export function isAudioLocked(): boolean {
  return _audioLockOwner !== null;
}

export function getAudioLockOwner(): string | null {
  return _audioLockOwner;
}
// ───────────────────────────────────────────────────────────────────────────

const RECORDING_OPTIONS: Audio.RecordingOptions = {
  isMeteringEnabled: true,
  android: {
    extension: ".m4a",
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 64000,
  },
  ios: {
    extension: ".m4a",
    audioQuality: Audio.IOSAudioQuality.MEDIUM,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 64000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: "audio/webm",
    bitsPerSecond: 64000,
  },
};

function getApiBase(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) return `https://${domain}`;
  throw new Error("EXPO_PUBLIC_DOMAIN is required for API calls");
}

let _instanceCounter = 0;

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const lockIdRef = useRef<string>(`recorder-${++_instanceCounter}`);

  const requestMicPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === "web") return false;
    const { status } = await Audio.requestPermissionsAsync();
    return status === "granted";
  }, []);

  const startRecording = useCallback(
    async (): Promise<boolean> => {
      if (Platform.OS === "web") return false;

      // Already recording on this instance — idempotent
      if (recordingRef.current) return true;

      // Try to acquire the global audio lock
      if (!tryAcquireAudioLock(lockIdRef.current)) {
        // Another recorder owns the mic — cannot start
        return false;
      }

      try {
        const granted = await requestMicPermission();
        if (!granted) {
          releaseAudioLock(lockIdRef.current);
          return false;
        }

        // NOTE: Do NOT set staysActiveInBackground — it causes audio session
        // conflicts on Android when two recording modes compete.
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording } = await Audio.Recording.createAsync(RECORDING_OPTIONS);
        recordingRef.current = recording;
        setIsRecording(true);
        return true;
      } catch {
        releaseAudioLock(lockIdRef.current);
        recordingRef.current = null;
        setIsRecording(false);
        return false;
      }
    },
    [requestMicPermission]
  );

  const stopRecording = useCallback(async (): Promise<string | null> => {
    const hadRecording = !!recordingRef.current;
    setIsRecording(false);

    if (!recordingRef.current) {
      releaseAudioLock(lockIdRef.current);
      return null;
    }

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      // Reset mode on iOS only (Android doesn't need it and it can cause issues)
      if (Platform.OS === "ios") {
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      }

      return uri ?? null;
    } catch {
      recordingRef.current = null;
      return null;
    } finally {
      if (hadRecording) releaseAudioLock(lockIdRef.current);
    }
  }, []);

  const transcribeAudio = useCallback(async (uri: string): Promise<string> => {
    setIsTranscribing(true);
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: "base64" as const,
      });

      const res = await fetch(`${getApiBase()}/api/gemini/transcribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio: base64, mimeType: "audio/m4a" }),
        signal: AbortSignal.timeout(20000),
      });

      if (!res.ok) return "";
      const data = await res.json();
      return (data as { text?: string }).text ?? "";
    } catch {
      return "";
    } finally {
      setIsTranscribing(false);
    }
  }, []);

  const getRecordingStatus =
    useCallback(async (): Promise<Audio.RecordingStatus | null> => {
      if (!recordingRef.current) return null;
      try {
        return await recordingRef.current.getStatusAsync();
      } catch {
        return null;
      }
    }, []);

  const cancelRecording = useCallback(async () => {
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch {}
      recordingRef.current = null;
    }
    releaseAudioLock(lockIdRef.current);
    setIsRecording(false);
  }, []);

  return {
    isRecording,
    isTranscribing,
    lockId: lockIdRef.current,
    startRecording,
    stopRecording,
    transcribeAudio,
    cancelRecording,
    requestMicPermission,
    getRecordingStatus,
  };
}
