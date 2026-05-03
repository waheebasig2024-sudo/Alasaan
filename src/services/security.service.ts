// ============================================================
// Security Intelligence Service
// يجمع بيانات الشبكة والنظام من Aiden v3.18.0
// ============================================================

export interface NetworkDevice {
  ip: string;
  mac?: string;
  hostname?: string;
  vendor?: string;
  isNew?: boolean;
  lastSeen: number;
}

export interface SecuritySnapshot {
  wifiSignal: number | null;
  wifiSsid: string | null;
  cpuUsage: number | null;
  ramUsage: number | null;
  ramTotal: number | null;
  devices: NetworkDevice[];
  openPorts: number[];
  threats: string[];
  timestamp: number;
}

export interface AidenSystemInfo {
  cpu?: { usage?: number; cores?: number };
  memory?: { used?: number; total?: number; percent?: number };
  network?: {
    ssid?: string;
    signal?: number;
    interface?: string;
    ip?: string;
  };
  devices?: NetworkDevice[];
  open_ports?: number[];
  threats?: string[];
}

const EMPTY_SNAPSHOT: SecuritySnapshot = {
  wifiSignal: null,
  wifiSsid: null,
  cpuUsage: null,
  ramUsage: null,
  ramTotal: null,
  devices: [],
  openPorts: [],
  threats: [],
  timestamp: Date.now(),
};

export async function fetchSecuritySnapshot(serverUrl: string): Promise<SecuritySnapshot> {
  const base = serverUrl.replace(/\/$/, "");

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${base}/api/system/info`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    clearTimeout(timer);

    if (!res.ok) return { ...EMPTY_SNAPSHOT, timestamp: Date.now() };

    const data: AidenSystemInfo = await res.json();

    return {
      wifiSignal: data.network?.signal ?? null,
      wifiSsid: data.network?.ssid ?? null,
      cpuUsage: data.cpu?.usage ?? null,
      ramUsage: data.memory?.used ?? null,
      ramTotal: data.memory?.total ?? null,
      devices: data.devices ?? [],
      openPorts: data.open_ports ?? [],
      threats: data.threats ?? [],
      timestamp: Date.now(),
    };
  } catch {
    return { ...EMPTY_SNAPSHOT, timestamp: Date.now() };
  }
}

export async function fetchNetworkScan(serverUrl: string): Promise<NetworkDevice[]> {
  const base = serverUrl.replace(/\/$/, "");
  try {
    const res = await fetch(`${base}/api/network/scan`, {
      signal: AbortSignal.timeout(15000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.devices) ? data.devices : [];
  } catch {
    return [];
  }
}

export function getSignalLabel(signal: number | null): string {
  if (signal === null) return "غير معروف";
  if (signal >= -50) return "ممتاز";
  if (signal >= -60) return "جيد";
  if (signal >= -70) return "متوسط";
  if (signal >= -80) return "ضعيف";
  return "سيء جداً";
}

export function getSignalColor(signal: number | null): string {
  if (signal === null) return "#5C6680";
  if (signal >= -50) return "#22c55e";
  if (signal >= -60) return "#84cc16";
  if (signal >= -70) return "#eab308";
  if (signal >= -80) return "#f97316";
  return "#ef4444";
}

export function getCpuColor(usage: number | null): string {
  if (usage === null) return "#5C6680";
  if (usage < 40) return "#22c55e";
  if (usage < 70) return "#eab308";
  if (usage < 90) return "#f97316";
  return "#ef4444";
}
