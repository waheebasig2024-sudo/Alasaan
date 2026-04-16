import { BaseTool } from "../base-tool";
import type { ToolContext, ToolResult } from "../../types/tool.types";
import { getAllAliases, addAlias } from "../../memory/aliases-memory";

export class AppAliasesTool extends BaseTool {
  name = "app_aliases";
  intent = "list_apps" as const;
  description = "عرض قائمة التطبيقات وأسمائها البديلة";
  requiresPermission = false;
  requiresConfirmation = false;

  async execute(_context: ToolContext): Promise<ToolResult> {
    const aliases = await getAllAliases();
    const summary = aliases
      .map((a) => `${a.canonical}${a.aliases.length > 0 ? ` (${a.aliases.slice(0, 2).join("، ")})` : ""}`)
      .join("\n");

    return this.success(`التطبيقات المعروفة (${aliases.length}):\n${summary}`, aliases);
  }
}
