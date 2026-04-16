import type { ToolResult } from "../types/tool.types";
import { mapToolResultToMessage } from "../tools/tool-result-mapper";

export interface ActionReport {
  message: string;
  success: boolean;
  toolName?: string;
  data?: unknown;
}

export function reportToolAction(toolName: string, result: ToolResult): ActionReport {
  return {
    message: mapToolResultToMessage(toolName, result),
    success: result.success,
    toolName,
    data: result.data,
  };
}

export function reportMemoryResult(
  found: boolean,
  key: string,
  value?: string
): ActionReport {
  if (found && value) {
    return { message: value, success: true };
  }
  return {
    message: `لا توجد معلومات محفوظة عن "${key}"`,
    success: false,
  };
}

export function reportGeminiResult(
  success: boolean,
  text?: string,
  error?: string
): ActionReport {
  if (success && text) {
    return { message: text, success: true };
  }
  return {
    message: error ?? "لم أتمكن من الإجابة على هذا السؤال حالياً",
    success: false,
  };
}
