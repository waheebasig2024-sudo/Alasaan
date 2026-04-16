import { BaseTool } from "../base-tool";
import type { ToolContext, ToolResult } from "../../types/tool.types";
import { scheduleReminderInMinutes } from "../../services/notifications.service";

export class ReminderTool extends BaseTool {
  name = "reminder";
  intent = "set_reminder" as const;
  description = "تعيين تذكير";
  requiresPermission = true;
  requiresConfirmation = false;

  async execute(context: ToolContext): Promise<ToolResult> {
    const { entities } = context;
    const title = entities.title ?? entities.task ?? "تذكير";
    const minutesStr = entities.minutes ?? entities.time;
    const minutes = minutesStr ? parseInt(minutesStr, 10) : 60;

    if (isNaN(minutes) || minutes <= 0) {
      return this.failure("لم أفهم وقت التذكير. حاول مثلاً: 'ذكرني بعد 30 دقيقة'");
    }

    const id = await scheduleReminderInMinutes(
      "الحسن - تذكير",
      title,
      minutes
    );

    if (!id) {
      return this.permissionDenied("الإشعارات");
    }

    return this.success(
      `تم ضبط تذكير "${title}" بعد ${minutes} دقيقة`,
      { id }
    );
  }
}
