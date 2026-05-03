// ============================================================
// WebSocket Provider — مزوّد الاتصال الفوري بـ Aiden
// يوفر حالة الاتصال والرسائل وتحديث IP لجميع الشاشات
// ============================================================

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { aidenWS, WsStatus, WsMessage } from "../services/websocket.service";
import { STORAGE_KEYS } from "../constants/storage-keys";
import { AIDEN_DEFAULT_URL } from "../config/aiden.config";

export interface ActivityEntry {
  id: string;
  icon: string;
  agent: string;
  message: string;
  timestamp: number;
}

interface WebSocketContextValue {
  wsStatus: WsStatus;
  recentActivity: ActivityEntry[];
  serverUrl: string;
  connectionLabel: string;
  latencyMs: number | null;
  reconnect: () => void;
  sendQuickChat: (message: string) => boolean;
  /** تحديث عنوان الخادم وإعادة الاتصال فوراً */
  updateServerUrl: (newUrl: string) => Promise<void>;
}

const WebSocketContext = createContext<WebSocketContextValue>({
  wsStatus: "disconnected",
  recentActivity: [],
  serverUrl: AIDEN_DEFAULT_URL,
  connectionLabel: "غير متصل",
  latencyMs: null,
  reconnect: () => {},
  sendQuickChat: () => false,
  updateServerUrl: async () => {},
});

export function useWebSocket() {
  return useContext(WebSocketContext);
}

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [wsStatus, setWsStatus] = useState<WsStatus>("disconnected");
  const [serverUrl, setServerUrl] = useState(AIDEN_DEFAULT_URL);
  const [recentActivity, setRecentActivity] = useState<ActivityEntry[]>([]);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const pingTimestampRef = useRef<number | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.AIDEN_SERVER_URL).then((v) => {
      const url = v ?? AIDEN_DEFAULT_URL;
      setServerUrl(url);
      aidenWS.connect(url);
    });

    const unsubStatus = aidenWS.onStatus(setWsStatus);
    const unsubMsg = aidenWS.onMessage((msg: WsMessage) => {
      if (msg.type === "pong" && pingTimestampRef.current !== null) {
        setLatencyMs(Date.now() - pingTimestampRef.current);
        pingTimestampRef.current = null;
      }
      if (msg.type === "activity") {
        const payload = msg.payload as {
          icon?: string;
          agent?: string;
          message?: string;
        };
        if (payload?.message) {
          const entry: ActivityEntry = {
            id: String(Date.now()),
            icon: payload.icon ?? "zap",
            agent: payload.agent ?? "Aiden",
            message: payload.message,
            timestamp: Date.now(),
          };
          setRecentActivity((prev) => [entry, ...prev].slice(0, 8));
        }
      }
    });

    const pingInterval = setInterval(() => {
      if (aidenWS.isConnected) {
        pingTimestampRef.current = Date.now();
        aidenWS.send({ type: "ping" });
      }
    }, 10000);

    return () => {
      unsubStatus();
      unsubMsg();
      clearInterval(pingInterval);
    };
  }, []);

  const reconnect = useCallback(() => {
    aidenWS.connect(serverUrl);
  }, [serverUrl]);

  const connectionLabel =
    wsStatus === "connected"
      ? "متصل"
      : wsStatus === "connecting"
      ? "جاري الاتصال..."
      : wsStatus === "error"
      ? "خطأ اتصال"
      : "غير متصل";

  const sendQuickChat = useCallback((message: string) => {
    return aidenWS.sendChat(message, "dashboard-quick");
  }, []);

  /**
   * تحديث عنوان الخادم — يحفظ في التخزين ويعيد الاتصال فوراً
   * يُستدعى من شاشة "إعدادات الاتصال"
   */
  const updateServerUrl = useCallback(async (newUrl: string) => {
    const clean = newUrl.trim().replace(/\/$/, "");
    if (!clean.startsWith("http")) return;

    await AsyncStorage.setItem(STORAGE_KEYS.AIDEN_SERVER_URL, clean);
    setServerUrl(clean);
    aidenWS.connect(clean);
  }, []);

  return (
    <WebSocketContext.Provider
      value={{
        wsStatus,
        recentActivity,
        serverUrl,
        connectionLabel,
        latencyMs,
        reconnect,
        sendQuickChat,
        updateServerUrl,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}
