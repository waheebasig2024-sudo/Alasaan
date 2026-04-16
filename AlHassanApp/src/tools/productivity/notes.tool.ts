import { BaseTool } from "../base-tool";
import type { ToolContext, ToolResult } from "../../types/tool.types";
import { createNote, getNotes, searchNotes } from "../../memory/notes-memory";

export class NotesTool extends BaseTool {
  name = "notes";
  intent = "create_note" as const;
  description = "إنشاء وإدارة الملاحظات";
  requiresPermission = false;
  requiresConfirmation = false;

  async execute(context: ToolContext): Promise<ToolResult> {
    const { entities } = context;
    const content = entities.content ?? entities.note ?? context.originalText;
    const title = entities.title ?? content.substring(0, 30);

    const note = await createNote(title, content);
    return this.success(`تم حفظ الملاحظة: "${title}"`, note);
  }
}
