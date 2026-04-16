import { BaseTool } from "../base-tool";
import type { ToolContext, ToolResult } from "../../types/tool.types";
import { openMaps } from "../../services/app-launcher.service";

export class MapsTool extends BaseTool {
  name = "maps";
  intent = "open_maps" as const;
  description = "فتح تطبيق الخرائط";
  requiresPermission = false;
  requiresConfirmation = false;

  async execute(context: ToolContext): Promise<ToolResult> {
    const query = context.entities.location ?? context.entities.destination ?? context.entities.place;
    const success = await openMaps(query);
    return success
      ? this.success(`تم فتح الخرائط${query ? ` للبحث عن "${query}"` : ""}`)
      : this.failure("فشل في فتح تطبيق الخرائط");
  }
}
