import type { AppSettings } from "../types/settings.types";

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "dark",
  language: "ar",
  voiceEnabled: true,
  voiceGender: "male",
  hapticFeedback: true,
  safeMode: false,
  requireConfirmationForCalls: true,
  requireConfirmationForMessages: true,
  requireConfirmationForDelete: true,
  geminiModel: "gemini-2.5-flash",
  maxConversationHistory: 50,
  userName: "",
  onboardingComplete: false,
};
