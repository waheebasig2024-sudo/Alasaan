// ============================================================
// WebSocket Service — اتصال فوري بـ Aiden v3.18.0
// Zero-latency bidirectional communication
// ============================================================

export type WsStatus = "connecting" | "connected" | "disconnected" | "error";

export interface WsMessage {
  type: "chat" | "ping" | "pong" | "activity" | "system" | "tool_result";
  payload?: unknown;
  id?: string;
}

export interface WsActivityPayload {
  icon: string;
  agent: string;
  message: string;
  style?: string;
}

type MessageHandler = (msg: WsMessage) => void;
type StatusHandler = (status: WsStatus) => void;

class AidenWebSocketService {
  private ws: WebSocket | null = null;
  private serverUrl = "";
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private messageHandlers = new Set<MessageHandler>();
  private statusHandlers = new Set<StatusHandler>();
  private intentionalClose = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(httpUrl: string): void {
    const wsUrl = httpUrl.replace(/^http/, "ws").replace(/\/$/, "") + "/ws";
    if (this.ws && this.serverUrl === wsUrl && this.ws.readyState === WebSocket.OPEN) return;

    this.serverUrl = wsUrl;
    this.intentionalClose = false;
    this.reconnectAttempts = 0;
    this._doConnect();
  }

  private _doConnect(): void {
    this._cleanup();
    this._setStatus("connecting");

    try {
      this.ws = new WebSocket(this.serverUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this._setStatus("connected");
        this._startPing();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg: WsMessage = JSON.parse(event.data as string);
          this.messageHandlers.forEach((h) => h(msg));
        } catch { /* ignore malformed */ }
      };

      this.ws.onclose = () => {
        this._stopPing();
        if (!this.intentionalClose) {
          this._setStatus("disconnected");
          this._scheduleReconnect();
        }
      };

      this.ws.onerror = () => {
        this._setStatus("error");
      };
    } catch {
      this._setStatus("error");
      this._scheduleReconnect();
    }
  }

  private _scheduleReconnect(): void {
    if (this.intentionalClose) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    this.reconnectAttempts++;
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000);
    this.reconnectTimer = setTimeout(() => this._doConnect(), delay);
  }

  private _startPing(): void {
    this.pingTimer = setInterval(() => {
      this.send({ type: "ping" });
    }, 25000);
  }

  private _stopPing(): void {
    if (this.pingTimer) { clearInterval(this.pingTimer); this.pingTimer = null; }
  }

  private _cleanup(): void {
    this._stopPing();
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
    if (this.ws) {
      try { this.ws.close(); } catch { /* ignore */ }
      this.ws = null;
    }
  }

  private _setStatus(status: WsStatus): void {
    this.statusHandlers.forEach((h) => h(status));
  }

  send(msg: WsMessage): boolean {
    if (this.ws?.readyState === WebSocket.OPEN) {
      try { this.ws.send(JSON.stringify(msg)); return true; } catch { return false; }
    }
    return false;
  }

  sendChat(message: string, session = "al-hassan-mobile"): boolean {
    return this.send({ type: "chat", payload: { message, session }, id: String(Date.now()) });
  }

  disconnect(): void {
    this.intentionalClose = true;
    this._cleanup();
    this._setStatus("disconnected");
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onStatus(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    return () => this.statusHandlers.delete(handler);
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const aidenWS = new AidenWebSocketService();
