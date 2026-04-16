import type { ParsedIntent } from "../types/intent.types";
import type { AppSettings } from "../types/settings.types";
import { requiresConfirmation, buildConfirmationMessage } from "../security/confirmation-policy";

export interface ConfirmationRequest {
  message: string;
  actionId: string;
  intent: ParsedIntent;
}

export function buildConfirmationRequest(
  intent: ParsedIntent,
  settings: AppSettings
): ConfirmationRequest | null {
  if (!intent.toolIntent) return null;

  const needsConfirmation = requiresConfirmation(intent.toolIntent, settings);
  if (!needsConfirmation) return null;

  return {
    message: buildConfirmationMessage(intent.toolIntent, intent.entities),
    actionId: `${intent.toolIntent}_${Date.now()}`,
    intent,
  };
}
