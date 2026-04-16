import type { ToolIntent } from "../types/intent.types";
import { SAFE_MODE_BLOCKED } from "./whitelist";

let _safeModeEnabled = false;

export function setSafeMode(enabled: boolean): void {
  _safeModeEnabled = enabled;
}

export function isSafeModeEnabled(): boolean {
  return _safeModeEnabled;
}

export function isBlockedInSafeMode(intent: ToolIntent): boolean {
  return _safeModeEnabled && SAFE_MODE_BLOCKED.includes(intent);
}

export function getSafeModeBlockedMessage(): string {
  return "هذا الإجراء محظور في وضع الأمان. يمكنك تعطيل وضع الأمان من الإعدادات.";
}
