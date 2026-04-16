import { Share } from "react-native";
import { BaseTool } from "../base-tool";
import type { ToolContext, ToolResult } from "../../types/tool.types";

export class ShareTool extends BaseTool {
  name = "share";
  intent = "share_content" as const;
  description = "مشاركة محتوى مع تطبيقات أخرى";
  requiresPermission = false;
  requiresConfirmation = false;

  async execute(context: ToolContext): Promise<ToolResult> {
    const content = context.entities.content ?? context.originalText;

    try {
      await Share.share({ message: content });
      return this.success("تم فتح قائمة المشاركة");
    } catch (error) {
      return this.failure("فشل في مشاركة المحتوى");
    }
  }
}
