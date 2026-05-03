export const COLORS = {
  // ── Primary backgrounds ──────────────────────────────────
  primaryBg: "#0B0F1A",
  secondaryBg: "#141928",
  cardBg: "#1A2236",
  surfaceBg: "#1E2A40",

  // ── Glassmorphism surfaces ───────────────────────────────
  glass: "rgba(255,255,255,0.04)",
  glassBorder: "rgba(255,255,255,0.08)",
  glassDark: "rgba(11,15,26,0.90)",
  glassCard: "rgba(26,34,54,0.85)",
  glassAccent: "rgba(212,168,83,0.08)",

  // ── Neon accent colors ───────────────────────────────────
  neonBlue: "#3b82f6",
  neonGreen: "#22c55e",
  neonPurple: "#8b5cf6",
  neonOrange: "#f97316",
  neonCyan: "#06b6d4",
  neonRed: "#ef4444",
  neonYellow: "#eab308",

  // ── Glow variants ────────────────────────────────────────
  neonBlueGlow: "rgba(59,130,246,0.20)",
  neonGreenGlow: "rgba(34,197,94,0.18)",
  neonPurpleGlow: "rgba(139,92,246,0.18)",
  neonOrangeGlow: "rgba(249,115,22,0.18)",
  neonCyanGlow: "rgba(6,182,212,0.15)",

  // ── Gold/Amber accent ────────────────────────────────────
  accent: "#D4A853",
  accentLight: "#E8C57A",
  accentDark: "#A07830",
  accentGlow: "rgba(212,168,83,0.15)",

  // ── Text colors ──────────────────────────────────────────
  textPrimary: "#F0F4FF",
  textSecondary: "#9AA5BE",
  textMuted: "#5C6680",
  textAccent: "#D4A853",

  // ── UI states ────────────────────────────────────────────
  success: "#4CAF7D",
  warning: "#F5A623",
  error: "#E05C5C",
  info: "#5B9BD5",
  successGlow: "rgba(76,175,125,0.15)",
  warningGlow: "rgba(245,166,35,0.12)",
  errorGlow: "rgba(224,92,92,0.12)",

  // ── Message bubbles ──────────────────────────────────────
  userBubble: "#1E3A5F",
  assistantBubble: "#141928",
  userBubbleBorder: "#2A5080",
  assistantBubbleBorder: "#1E2A40",

  // ── Borders & dividers ───────────────────────────────────
  border: "#232D42",
  borderLight: "#2E3B55",
  divider: "#1A2236",

  // ── Overlays ─────────────────────────────────────────────
  overlay: "rgba(0,0,0,0.75)",
  overlayLight: "rgba(0,0,0,0.40)",
  overlayDark: "rgba(0,0,0,0.92)",

  // ── Status indicators ────────────────────────────────────
  online: "#4CAF7D",
  offline: "#E05C5C",

  // ── Transparent ──────────────────────────────────────────
  transparent: "transparent",
} as const;

export type ColorKey = keyof typeof COLORS;

// ── Glassmorphism card helper ────────────────────────────────
export const GLASS = {
  card: {
    backgroundColor: COLORS.glassCard,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  surface: {
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
} as const;
