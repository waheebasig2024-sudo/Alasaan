export type IntentCategory =
  | "tool"
  | "memory"
  | "memory_save"
  | "question"
  | "greeting"
  | "clarification"
  | "unknown";

export type ToolIntent =
  | "open_camera"
  | "make_call"
  | "send_message"
  | "open_maps"
  | "set_reminder"
  | "search_contacts"
  | "open_app"
  | "take_photo"
  | "open_gallery"
  | "record_audio"
  | "get_location"
  | "search_web"
  | "open_browser"
  | "create_note"
  | "read_notes"
  | "set_alarm"
  | "share_content"
  | "list_apps"
  | "check_files"
  | "send_email"
  | "schedule_event";

export interface ParsedIntent {
  category: IntentCategory;
  toolIntent?: ToolIntent;
  confidence: number;
  entities: Record<string, string>;
  normalizedText: string;
  originalText: string;
  requiresConfirmation: boolean;
}
