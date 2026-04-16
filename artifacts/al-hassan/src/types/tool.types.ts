import type { ToolIntent } from "./intent.types";

export type ToolStatus = "idle" | "running" | "success" | "error" | "permission_denied" | "not_available";

export interface ToolResult {
  success: boolean;
  message: string;
  data?: unknown;
  status: ToolStatus;
}

export interface ToolContext {
  intent: ToolIntent;
  entities: Record<string, string>;
  originalText: string;
  userId: string;
}

export interface Tool {
  name: string;
  intent: ToolIntent;
  description: string;
  requiresPermission: boolean;
  requiresConfirmation: boolean;
  isAvailable(): Promise<boolean>;
  execute(context: ToolContext): Promise<ToolResult>;
}

export interface ToolPermissionStatus {
  toolName: string;
  granted: boolean;
  canRequest: boolean;
}
