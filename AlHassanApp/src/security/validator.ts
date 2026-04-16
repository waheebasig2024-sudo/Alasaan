import type { ParsedIntent } from "../types/intent.types";
import { SENSITIVE_ACTIONS } from "./whitelist";

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  requiresConfirmation: boolean;
}

export function validateIntent(intent: ParsedIntent): ValidationResult {
  if (intent.confidence < 0.3) {
    return {
      isValid: false,
      reason: "مستوى الثقة منخفض جداً في تفسير الطلب",
      requiresConfirmation: false,
    };
  }

  if (
    intent.toolIntent &&
    SENSITIVE_ACTIONS.includes(intent.toolIntent)
  ) {
    return {
      isValid: true,
      requiresConfirmation: true,
    };
  }

  return {
    isValid: true,
    requiresConfirmation: intent.requiresConfirmation,
  };
}

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "")
    .substring(0, 1000);
}

export function isValidPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");
  return /^[+\d]{7,15}$/.test(cleaned);
}
