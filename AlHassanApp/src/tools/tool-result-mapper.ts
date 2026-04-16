import type { ToolResult } from "../types/tool.types";

export function mapToolResultToMessage(
  toolName: string,
  result: ToolResult
): string {
  if (result.success) {
    return result.message;
  }

  switch (result.status) {
    case "permission_denied":
      return `لم أتمكن من التنفيذ: ${result.message}. يمكنك منح الصلاحية من الإعدادات.`;
    case "not_available":
      return `هذه الميزة غير متاحة على جهازك حالياً.`;
    case "error":
    default:
      return `حدث خطأ أثناء تنفيذ "${toolName}": ${result.message}`;
  }
}
