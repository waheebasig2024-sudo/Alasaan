export async function isOnline(): Promise<boolean> {
  try {
    const response = await fetch("https://www.google.com/favicon.ico", {
      method: "HEAD",
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function fetchWithTimeout<T>(
  url: string,
  options: RequestInit = {},
  timeoutMs = 15000
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  } finally {
    clearTimeout(timer);
  }
}
