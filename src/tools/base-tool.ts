import type { Tool, ToolContext, ToolResult } from "../types/tool.types";
import type { ToolIntent } from "../types/intent.types";
import { logger } from "../utils/logger";

export abstract class BaseTool implements Tool {
  abstract name: string;
  abstract intent: ToolIntent;
  abstract description: string;
  requiresPermission = false;
  requiresConfirmation = false;

  async isAvailable(): Promise<boolean> {
    return true;
  }

  abstract execute(context: ToolContext): Promise<ToolResult>;

  protected success(message: string, data?: unknown): ToolResult {
    logger.info(this.name, `Success: ${message}`);
    return { success: true, message, data, status: "success" };
  }

  protected failure(message: string, data?: unknown): ToolResult {
    logger.warn(this.name, `Failure: ${message}`);
    return { success: false, message, data, status: "error" };
  }

  protected permissionDenied(permissionLabel: string): ToolResult {
    return {
      success: false,
      message: `لا توجد صلاحية للوصول إلى ${permissionLabel}`,
      status: "permission_denied",
    };
  }

  protected notAvailable(): ToolResult {
    return {
      success: false,
      message: `هذه الأداة غير متاحة على هذا الجهاز`,
      status: "not_available",
    };
  }
}
