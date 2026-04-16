export function now(): number {
  return Date.now();
}

export function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "الآن";
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  if (hours < 24) return `منذ ${hours} ساعة`;
  if (days === 1) return "أمس";
  if (days < 7) return `منذ ${days} أيام`;
  return new Date(timestamp).toLocaleDateString("ar-SA");
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("ar-SA", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString("ar-SA");
}
