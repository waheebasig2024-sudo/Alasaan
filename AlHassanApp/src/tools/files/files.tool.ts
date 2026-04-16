import { BaseTool } from "../base-tool";
import type { ToolContext, ToolResult } from "../../types/tool.types";
import { listFiles } from "../../services/files.service";

export class FilesTool extends BaseTool {
  name = "files";
  intent = "check_files" as const;
  description = "عرض قائمة الملفات";
  requiresPermission = false;
  requiresConfirmation = false;

  async execute(_context: ToolContext): Promise<ToolResult> {
    const files = await listFiles();

    if (files.length === 0) {
      return this.success("لا توجد ملفات محفوظة حالياً");
    }

    return this.success(
      `الملفات المحفوظة (${files.length}):\n${files.join("\n")}`,
      files
    );
  }
}
