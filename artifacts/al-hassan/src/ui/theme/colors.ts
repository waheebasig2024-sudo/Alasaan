export const COLORS = {
  // Primary brand colors
  primaryBg: "#0B0F1A",
  secondaryBg: "#141928",
  cardBg: "#1A2236",
  surfaceBg: "#1E2A40",

  // Gold/Amber accent
  accent: "#D4A853",
  accentLight: "#E8C57A",
  accentDark: "#A07830",
  accentGlow: "rgba(212,168,83,0.15)",

  // Text colors
  textPrimary: "#F0F4FF",
  textSecondary: "#9AA5BE",
  textMuted: "#5C6680",
  textAccent: "#D4A853",

  // UI states
  success: "#4CAF7D",
  warning: "#F5A623",
  error: "#E05C5C",
  info: "#5B9BD5",
  successGlow: "rgba(76,175,125,0.15)",
  warningGlow: "rgba(245,166,35,0.12)",
  errorGlow: "rgba(224,92,92,0.12)",

  // Message bubbles
  userBubble: "#1E3A5F",
  assistantBubble: "#141928",
  userBubbleBorder: "#2A5080",
  assistantBubbleBorder: "#1E2A40",

  // Borders & dividers
  border: "#232D42",
  borderLight: "#2E3B55",
  divider: "#1A2236",

  // Overlays
  overlay: "rgba(0,0,0,0.7)",
  overlayLight: "rgba(0,0,0,0.4)",

  // Status indicators
  online: "#4CAF7D",
  offline: "#E05C5C",

  // Transparent
  transparent: "transparent",
} as const;

export type ColorKey = keyof typeof COLORS;
