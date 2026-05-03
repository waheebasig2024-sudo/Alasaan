export const APP_CONFIG = {
  APP_NAME: "الحسن",
  APP_VERSION: "1.0.0",
  DEFAULT_LANGUAGE: "ar",
  DEFAULT_THEME: "dark",
  MAX_CONVERSATION_HISTORY: 50,
  MAX_MEMORY_ENTRIES: 500,
  GEMINI_MODEL: "gemini-2.5-flash",
  GEMINI_TEMPERATURE: 0.7,
    GEMINI_MAX_TOKENS: 8192,
  REQUEST_TIMEOUT_MS: 15000,
  MIN_ANDROID_SDK: 28,
    API_BASE_URL: process.env.EXPO_PUBLIC_DOMAIN
      ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
      : "",
  GEMINI_ENDPOINT: `/api/gemini/chat`,
} as const;
