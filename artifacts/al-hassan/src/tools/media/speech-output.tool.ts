import { BaseTool } from "../base-tool";
import type { ToolContext, ToolResult } from "../../types/tool.types";
import { speak } from "../../services/speech.service";

export class SpeechOutputTool extends BaseTool {
  name = "speech_output";
  intent = "take_photo" as const; // Placeholder intent, invoked programmatically
  description = "قراءة النص بصوت عالٍ";
  requiresPermission = false;
  requiresConfirmation = false;

  async execute(context: ToolContext): Promise<ToolResult> {
    const text = context.entities.text ?? context.originalText;
    await speak(text, { language: "ar-SA" });
    return this.success("جاري القراءة...");
  }
}
