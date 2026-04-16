export type MessageRole = "user" | "assistant" | "system";
export type MessageStatus = "sending" | "delivered" | "error" | "streaming";

export type MessageContentType = "text" | "tool-result" | "confirmation-request" | "error";

export interface ToolResultContent {
  toolName: string;
  success: boolean;
  summary: string;
  details?: string;
}

export interface ConfirmationContent {
  actionId: string;
  actionDescription: string;
  isConfirmed?: boolean;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  contentType: MessageContentType;
  status: MessageStatus;
  timestamp: number;
  toolResult?: ToolResultContent;
  confirmationData?: ConfirmationContent;
  metadata?: Record<string, unknown>;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: number;
  lastActiveAt: number;
}
