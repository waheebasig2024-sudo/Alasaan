import { BaseTool } from "../base-tool";
import type { ToolContext, ToolResult } from "../../types/tool.types";
import { openCamera } from "../../services/camera.service";

export class CameraTool extends BaseTool {
  name = "camera";
  intent = "open_camera" as const;
  description = "فتح الكاميرا لالتقاط صورة";
  requiresPermission = true;
  requiresConfirmation = false;

  async execute(context: ToolContext): Promise<ToolResult> {
    const media = await openCamera("photo");

    if (!media) {
      return this.permissionDenied("الكاميرا");
    }

    return this.success("تم التقاط الصورة", { uri: media.uri });
  }
}
