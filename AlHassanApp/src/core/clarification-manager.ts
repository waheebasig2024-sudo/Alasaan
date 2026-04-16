import type { ParsedIntent } from "../types/intent.types";

export interface ClarificationOption {
  label: string;
  intent: ParsedIntent;
}

export function needsClarification(intent: ParsedIntent): boolean {
  return intent.confidence < 0.4 && intent.category !== "greeting";
}

export function buildClarificationMessage(
  originalText: string,
  alternatives: ParsedIntent[]
): string {
  if (alternatives.length === 0) {
    return `لم أفهم "${originalText}". هل يمكنك توضيح ما تريد؟`;
  }

  const options = alternatives
    .map((a, i) => `${i + 1}. ${getIntentDescription(a)}`)
    .join("\n");

  return `لم أتأكد من فهم طلبك. هل تقصد:\n${options}`;
}

function getIntentDescription(intent: ParsedIntent): string {
  switch (intent.toolIntent) {
    case "open_camera":
      return "فتح الكاميرا";
    case "make_call":
      return `الاتصال بـ "${intent.entities.contact ?? "..."}"`;
    case "send_message":
      return "إرسال رسالة";
    case "open_maps":
      return "فتح الخرائط";
    case "set_reminder":
      return "ضبط تذكير";
    default:
      return intent.category === "question" ? "الإجابة على سؤال" : "تنفيذ أمر";
  }
}

export function learnFromClarification(
  originalText: string,
  confirmedIntent: ParsedIntent
): void {
  // TODO: Save successful patterns to improve future classification
}
