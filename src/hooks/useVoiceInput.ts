import { useState, useCallback, useEffect, useRef } from "react";
import { useVoiceRecorder } from "./useVoiceRecorder";

interface UseVoiceInputOptions {
  onTranscript?: (text: string) => void;
  autoStopOnSilence?: boolean;
}

const METER_INTERVAL_MS = 250;
const MIN_RECORDING_MS = 1000;
const SILENCE_DURATION_MS = 1300;
const MAX_RECORDING_MS = 45000;
const SILENCE_THRESHOLD_DB = -45;

export function useVoiceInput({
  onTranscript,
  autoStopOnSilence = true,
}: UseVoiceInputOptions = {}) {
  const [transcript, setTranscript] = useState("");
  const startedAtRef = useRef(0);
  const silenceStartedAtRef = useRef<number | null>(null);
  const stoppingRef = useRef(false);
  const {
    isRecording,
    isTranscribing,
    startRecording,
    stopRecording,
    transcribeAudio,
    cancelRecording,
    getRecordingStatus,
  } = useVoiceRecorder();

  const startListening = useCallback(async (): Promise<void> => {
    setTranscript("");
    silenceStartedAtRef.current = null;
    stoppingRef.current = false;
    const started = await startRecording();
    if (started) startedAtRef.current = Date.now();
  }, [startRecording]);

  const stopListening = useCallback(async (): Promise<string> => {
    const uri = await stopRecording();
    if (!uri) return "";

    const text = await transcribeAudio(uri);
    setTranscript(text);
    if (text) onTranscript?.(text);
    return text;
  }, [stopRecording, transcribeAudio, onTranscript]);

  useEffect(() => {
    if (!isRecording || !autoStopOnSilence) return;

    const timer = setInterval(async () => {
      if (stoppingRef.current) return;

      const elapsed = Date.now() - startedAtRef.current;
      if (elapsed >= MAX_RECORDING_MS) {
        stoppingRef.current = true;
        await stopListening();
        return;
      }

      if (elapsed < MIN_RECORDING_MS) return;

      const status = await getRecordingStatus();
      if (!status?.isRecording) return;

      const metering = typeof status.metering === "number" ? status.metering : null;
      if (metering === null) return;

      if (metering <= SILENCE_THRESHOLD_DB) {
        if (silenceStartedAtRef.current === null) {
          silenceStartedAtRef.current = Date.now();
          return;
        }

        if (Date.now() - silenceStartedAtRef.current >= SILENCE_DURATION_MS) {
          stoppingRef.current = true;
          await stopListening();
        }
      } else {
        silenceStartedAtRef.current = null;
      }
    }, METER_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [autoStopOnSilence, getRecordingStatus, isRecording, stopListening]);

  const cancel = useCallback(async () => {
    await cancelRecording();
    setTranscript("");
  }, [cancelRecording]);

  return {
    isListening: isRecording,
    isTranscribing,
    transcript,
    startListening,
    stopListening,
    cancel,
  };
}
