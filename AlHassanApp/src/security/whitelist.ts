import type { ToolIntent } from "../types/intent.types";

// Actions that always require explicit user confirmation
export const SENSITIVE_ACTIONS: ToolIntent[] = [
  "make_call",
  "send_message",
  "send_email",
  "schedule_event",
];

// Actions blocked in safe mode
export const SAFE_MODE_BLOCKED: ToolIntent[] = [
  "make_call",
  "send_message",
  "send_email",
];

// Allowed URL schemes for the browser tool
export const ALLOWED_URL_SCHEMES = ["https://", "http://"];

// Max message length
export const MAX_INPUT_LENGTH = 1000;
