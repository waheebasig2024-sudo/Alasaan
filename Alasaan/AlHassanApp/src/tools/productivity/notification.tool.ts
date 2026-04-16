import { BaseTool } from "../base-tool";
import type { ToolContext, ToolResult } from "../../types/tool.types";
import { scheduleNotification } from "../../services/notifications.service";

export class NotificationTool extends BaseTool {
  name = "notification";
  intent = "set_alarm" as const;
  description = "إرسال إشعار فوري";
  requiresPermission = true;
  requiresConfirmation = false;

  async execute(context: ToolContext): Promise<ToolResult> {
    const title = context.entities.title ?? "الحسن";
    const body = context.entities.body ?? context.originalText;
    const date = new Date(Date.now() + 5000); // 5 seconds from now

    const id = await scheduleNotification(title, body, date);

    return id
      ? this.success("تم إرسال الإشعار")
      : this.permissionDenied("الإشعارات");
  }
}
