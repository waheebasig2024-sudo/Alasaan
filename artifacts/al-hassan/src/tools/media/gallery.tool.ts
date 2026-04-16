import { BaseTool } from "../base-tool";
import type { ToolContext, ToolResult } from "../../types/tool.types";
import { openGallery } from "../../services/camera.service";

export class GalleryTool extends BaseTool {
  name = "gallery";
  intent = "open_gallery" as const;
  description = "فتح معرض الصور";
  requiresPermission = true;
  requiresConfirmation = false;

  async execute(context: ToolContext): Promise<ToolResult> {
    const media = await openGallery();

    if (!media) {
      return this.failure("لم يتم اختيار صورة أو تم الإلغاء");
    }

    return this.success("تم فتح الصورة", { uri: media.uri });
  }
}
