import { Platform } from "react-native";
import { BaseTool } from "../base-tool";
import type { ToolContext, ToolResult } from "../../types/tool.types";
import { getContactByName } from "../../services/contacts.service";
import { sendWhatsApp, openApp } from "../../services/app-launcher.service";
import { resolveAppName } from "../../memory/aliases-memory";

export class SendMessageTool extends BaseTool {
  name = "send_message";
  intent = "send_message" as const;
  description = "إرسال رسالة واتساب";
  requiresPermission = false;
  requiresConfirmation = true;

  async isAvailable(): Promise<boolean> {
    return Platform.OS !== "web";
  }

  async execute(context: ToolContext): Promise<ToolResult> {
    const { entities } = context;
    const msgBody = entities.message ?? "";
    let phone = entities.phone;

    // Try to resolve contact name → phone
    if (!phone) {
      const contactName = entities.contact ?? entities.name;
      if (contactName) {
        const contact = await getContactByName(contactName);
        if (contact?.phoneNumber) {
          phone = contact.phoneNumber;
        } else {
          // Can't find contact — open WhatsApp for manual selection
          const app = await resolveAppName("واتساب");
          if (app) {
            const success = await openApp(app);
            return success
              ? this.success(`فتحت واتساب — لم أجد رقم "${contactName}" في جهات الاتصال`)
              : this.failure(`لم أجد رقم "${contactName}" في جهات الاتصال`);
          }
          return this.failure(`لم أجد رقم "${contactName}" في جهات الاتصال`);
        }
      }
    }

    if (phone) {
      const success = await sendWhatsApp(phone, msgBody);
      const label = entities.contact ?? phone;
      return success
        ? this.success(`تم فتح واتساب للإرسال إلى ${label}`)
        : this.failure("فشل في فتح واتساب");
    }

    // No contact/phone — just open WhatsApp
    const app = await resolveAppName("واتساب");
    if (app) {
      const success = await openApp(app);
      return success
        ? this.success("تم فتح واتساب")
        : this.failure("فشل في فتح واتساب");
    }

    return this.failure("لم أتمكن من فتح واتساب");
  }
}
