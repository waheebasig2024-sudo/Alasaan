// ============================================================
// إعدادات الاتصال بسيرفر Aiden v3.18.0
// ============================================================
// التطبيق وKali يعملان على نفس الجهاز (Termux)
// لذلك العنوان الافتراضي هو localhost = 127.0.0.1
// يمكن تغييره من داخل الإعدادات في التطبيق
// ============================================================

export const AIDEN_DEFAULT_IP = "127.0.0.1";
export const AIDEN_DEFAULT_PORT = 4200;
export const AIDEN_DEFAULT_URL = `http://${AIDEN_DEFAULT_IP}:${AIDEN_DEFAULT_PORT}`;

export const AIDEN_ENDPOINTS = {
  health: "/api/health",
  chat: "/api/chat",
  models: "/api/models",
  stream: "/api/stream",
  goals: "/api/goals",
  tts: "/api/tts",
  // ── Security & System ───────────────
  systemInfo: "/api/system/info",
  networkScan: "/api/network/scan",
  // ── Knowledge Vault ─────────────────
  memoryLessons: "/api/memory/lessons",
  memoryProfile: "/api/memory/profile",
  lessonsUpdate: "/api/memory/lessons/update",
  lessonsDelete: "/api/memory/lessons/delete",
  // ── WebSocket ───────────────────────
  ws: "/ws",
} as const;

export const AIDEN_TIMEOUTS = {
  connection: 5000,
  chat: 60000,
  tts: 10000,
  system: 8000,
  scan: 15000,
} as const;

export interface AidenServerConfig {
  serverUrl: string;
  isConnected: boolean;
  lastChecked: number | null;
  version?: string;
}

export const DEFAULT_AIDEN_CONFIG: AidenServerConfig = {
  serverUrl: AIDEN_DEFAULT_URL,
  isConnected: false,
  lastChecked: null,
};
