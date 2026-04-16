import { BaseTool } from "../base-tool";
import type { ToolContext, ToolResult } from "../../types/tool.types";
import { openBrowser } from "../../services/app-launcher.service";

export class BrowserTool extends BaseTool {
  name = "browser";
  intent = "search_web" as const;
  description = "فتح رابط في المتصفح";
  requiresPermission = false;
  requiresConfirmation = false;

  async execute(context: ToolContext): Promise<ToolResult> {
    const url = context.entities.url ?? context.entities.link ?? context.originalText;
    const success = await openBrowser(url);
    return success
      ? this.success(`تم فتح الرابط`)
      : this.failure("فشل في فتح المتصفح");
  }
}
