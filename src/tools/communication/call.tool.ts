import { Platform } from "react-native";
import { BaseTool } from "../base-tool";
import type { ToolContext, ToolResult } from "../../types/tool.types";
import { getContactByName } from "../../services/contacts.service";
import { makePhoneCall } from "../../services/app-launcher.service";
import { isValidPhoneNumber } from "../../security/validator";

export class CallTool extends BaseTool {
  name = "call";
  intent = "make_call" as const;
  description = "الاتصال بجهة اتصال أو رقم هاتف";
  requiresPermission = true;
  requiresConfirmation = true;

  async isAvailable(): Promise<boolean> {
    return Platform.OS !== "web";
  }

  async execute(context: ToolContext): Promise<ToolResult> {
    const { entities } = context;
    let phone = entities.phone ?? entities.number;

    if (!phone) {
      const name = entities.contact ?? entities.name;
      if (!name) {
        return this.failure("لم يتم تحديد جهة الاتصال أو رقم الهاتف");
      }

      const contact = await getContactByName(name);
      if (!contact || !contact.phoneNumber) {
        return this.failure(`لم أجد رقم "${name}" في جهات الاتصال`);
      }
      phone = contact.phoneNumber;
    }

    if (!isValidPhoneNumber(phone)) {
      return this.failure(`"${phone}" ليس رقم هاتف صحيح`);
    }

    const success = await makePhoneCall(phone);
    return success
      ? this.success(`جاري الاتصال بـ ${phone}`)
      : this.failure("فشل في فتح تطبيق الاتصال");
  }
}
