import type { ParsedIntent } from "../types/intent.types";
import type { AppSettings } from "../types/settings.types";
import { buildConfirmationRequest } from "../tools/tool-confirmation";
import { isBlockedInSafeMode } from "../security/safe-mode";

export type PlanStep =
  | { type: "tool"; intent: ParsedIntent }
  | { type: "memory_lookup"; query: string; intent: ParsedIntent }
  | { type: "memory_save"; key: string; value: string; intent: ParsedIntent }
  | { type: "gemini"; message: string; intent: ParsedIntent }
  | { type: "confirm"; confirmationId: string; message: string; intent: ParsedIntent }
  | { type: "blocked"; reason: string }
  | { type: "greeting" };

export function planExecution(
  intent: ParsedIntent,
  settings: AppSettings
): PlanStep {
  // Check safe mode
  if (intent.toolIntent && isBlockedInSafeMode(intent.toolIntent)) {
    return { type: "blocked", reason: "هذا الإجراء محظور في وضع الأمان" };
  }

  // Greeting
  if (intent.category === "greeting") {
    return { type: "greeting" };
  }

  // Memory SAVE path
  if (intent.category === "memory_save") {
    const key = intent.entities.memoryKey ?? intent.normalizedText.substring(0, 40);
    const value = intent.entities.memoryValue ?? intent.originalText;
    return { type: "memory_save", key, value, intent };
  }

  // Tool execution path
  if (intent.category === "tool" && intent.toolIntent) {
    const confirmReq = buildConfirmationRequest(intent, settings);
    if (confirmReq) {
      return {
        type: "confirm",
        confirmationId: confirmReq.actionId,
        message: confirmReq.message,
        intent,
      };
    }
    return { type: "tool", intent };
  }

  // Memory LOOKUP path
  if (intent.category === "memory") {
    return { type: "memory_lookup", query: intent.normalizedText, intent };
  }

  // Gemini for questions and everything else
  return { type: "gemini", message: intent.originalText, intent };
}
