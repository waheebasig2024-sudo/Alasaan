import { Platform } from "react-native";
import { BaseTool } from "../base-tool";
import type { ToolContext, ToolResult } from "../../types/tool.types";
import { createEvent } from "../../services/calendar.service";

export class CalendarTool extends BaseTool {
  name = "calendar";
  intent = "schedule_event" as const;
  description = "إضافة حدث إلى التقويم";
  requiresPermission = true;
  requiresConfirmation = true;

  async isAvailable(): Promise<boolean> {
    return Platform.OS !== "web";
  }

  async execute(context: ToolContext): Promise<ToolResult> {
    const { entities } = context;
    const title = entities.title ?? entities.event ?? "حدث جديد";

    // Parse date/time from entities or use tomorrow
    const now = new Date();
    const startDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    startDate.setHours(9, 0, 0, 0);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    const id = await createEvent({
      title,
      startDate,
      endDate,
      notes: entities.notes,
      location: entities.location,
    });

    return id
      ? this.success(`تم إضافة "${title}" إلى التقويم`, { id })
      : this.permissionDenied("التقويم");
  }
}
