import { BaseTool } from "../base-tool";
import type { ToolContext, ToolResult } from "../../types/tool.types";
import { searchContacts } from "../../services/contacts.service";

export class ContactsTool extends BaseTool {
  name = "contacts";
  intent = "search_contacts" as const;
  description = "البحث في جهات الاتصال";
  requiresPermission = true;
  requiresConfirmation = false;

  async execute(context: ToolContext): Promise<ToolResult> {
    const query = context.entities.contact ?? context.entities.name ?? context.originalText;

    if (!query) {
      return this.failure("لم يتم تحديد اسم للبحث");
    }

    const contacts = await searchContacts(query);

    if (contacts.length === 0) {
      return this.failure(`لم أجد جهة اتصال باسم "${query}"`);
    }

    const summary = contacts
      .map((c) => `${c.name}${c.phoneNumber ? ` - ${c.phoneNumber}` : ""}`)
      .join("\n");

    return this.success(`وجدت ${contacts.length} نتيجة:\n${summary}`, contacts);
  }
}
