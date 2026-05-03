import { Platform } from "react-native";
import { Audio } from "expo-av";
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
    if (Platform.OS === "web") {
      return this.failure("تسجيل الصوت غير مدعوم على الويب.");
    }

    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        return this.failure("تم رفض إذن الميكروفون.");
      }

      return this.success("تم منح إذن الميكروفون وجاهز للتسجيل.");
    } catch {
      return this.failure("تعذر تهيئة التسجيل الصوتي.");
    }
  }
}
