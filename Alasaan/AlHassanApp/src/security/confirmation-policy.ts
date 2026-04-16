import type { ToolIntent } from "../types/intent.types";
import type { AppSettings } from "../types/settings.types";
import { SENSITIVE_ACTIONS } from "./whitelist";

export function requiresConfirmation(
  intent: ToolIntent,
  settings: AppSettings
): boolean {
  if (intent === "make_call" && settings.requireConfirmationForCalls) return true;
  if (intent === "send_message" && settings.requireConfirmationForMessages) return true;
  if (SENSITIVE_ACTIONS.includes(intent)) return true;
  return false;
}

export function buildConfirmationMessage(
  intent: ToolIntent,
  entities: Record<string, string>
): string {
  const target = entities.contact ?? entities.name ?? entities.phone ?? "";

  switch (intent) {
    case "make_call":
      return `هل تريد الاتصال بـ "${target}"؟`;
    case "send_message":
      return `هل تريد إرسال رسالة لـ "${target}"؟`;
    case "send_email":
      return `هل تريد إرسال بريد إلكتروني لـ "${target}"؟`;
    case "schedule_event":
      return `هل تريد إضافة حدث "${entities.title ?? ""}" إلى التقويم؟`;
    default:
      return "هل أنت متأكد من تنفيذ هذا الإجراء؟";
  }
}
