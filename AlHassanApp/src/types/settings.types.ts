export type Theme = "dark" | "light" | "system";
export type Language = "ar" | "en";
export type VoiceGender = "male" | "female";

export interface AppSettings {
  theme: Theme;
  language: Language;
  voiceEnabled: boolean;
  voiceGender: VoiceGender;
  hapticFeedback: boolean;
  safeMode: boolean;
  requireConfirmationForCalls: boolean;
  requireConfirmationForMessages: boolean;
  requireConfirmationForDelete: boolean;
  geminiModel: string;
  maxConversationHistory: number;
  userName: string;
  onboardingComplete: boolean;
}
