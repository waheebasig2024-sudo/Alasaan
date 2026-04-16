import { Platform } from "react-native";
import { BaseTool } from "../base-tool";
import type { ToolContext, ToolResult } from "../../types/tool.types";

export class AudioRecordTool extends BaseTool {
  name = "audio_record";
  intent = "record_audio" as const;
  description = "تسجيل صوتي";
  requiresPermission = true;
  requiresConfirmation = false;

  async isAvailable(): Promise<boolean> {
    return Platform.OS !== "web";
  }

  async execute(_context: ToolContext): Promise<ToolResult> {
    // TODO: Implement with expo-av Audio.Recording in a full native build
    // expo-av requires native modules and full setup
    return this.failure(
      "تسجيل الصوت يحتاج إلى إعداد إضافي. سيتوفر في الإصدار القادم."
    );
  }
}
