import { BaseTool } from "../base-tool";
import type { ToolContext, ToolResult } from "../../types/tool.types";
import { resolveAppName } from "../../memory/aliases-memory";
import { openApp } from "../../services/app-launcher.service";

export class OpenAppTool extends BaseTool {
  name = "open_app";
  intent = "open_app" as const;
  description = "فتح تطبيق على الجهاز";
  requiresPermission = false;
  requiresConfirmation = false;

  async execute(context: ToolContext): Promise<ToolResult> {
    const appName = context.entities.app ?? context.entities.name ?? context.originalText;

    if (!appName) {
      return this.failure("لم يتم تحديد اسم التطبيق");
    }

    const app = await resolveAppName(appName);
    if (!app) {
      return this.failure(`لم أجد تطبيقاً باسم "${appName}"`);
    }

    const success = await openApp(app);
    return success
      ? this.success(`تم فتح ${app.canonical}`)
      : this.failure(`لم أتمكن من فتح ${app.canonical}`);
  }
}
