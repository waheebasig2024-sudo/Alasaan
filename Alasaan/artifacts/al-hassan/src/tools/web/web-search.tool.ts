import { BaseTool } from "../base-tool";
import type { ToolContext, ToolResult } from "../../types/tool.types";
import { openBrowser } from "../../services/app-launcher.service";

export class WebSearchTool extends BaseTool {
  name = "web_search";
  intent = "search_web" as const;
  description = "البحث في الإنترنت";
  requiresPermission = false;
  requiresConfirmation = false;

  async execute(context: ToolContext): Promise<ToolResult> {
    const query = context.entities.query ?? context.originalText;
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=ar`;

    const success = await openBrowser(searchUrl);
    return success
      ? this.success(`جاري البحث عن "${query}"`)
      : this.failure("فشل في فتح المتصفح");
  }
}
