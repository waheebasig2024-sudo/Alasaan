import { BaseTool } from "../base-tool";
import type { ToolContext, ToolResult } from "../../types/tool.types";
import { getCurrentLocation, reverseGeocode } from "../../services/location.service";

export class LocationTool extends BaseTool {
  name = "location";
  intent = "get_location" as const;
  description = "الحصول على الموقع الحالي";
  requiresPermission = true;
  requiresConfirmation = false;

  async execute(_context: ToolContext): Promise<ToolResult> {
    const loc = await getCurrentLocation();

    if (!loc) {
      return this.permissionDenied("الموقع الجغرافي");
    }

    const address = await reverseGeocode(loc.latitude, loc.longitude);

    const message = address
      ? `موقعك الحالي: ${address}`
      : `موقعك: ${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`;

    return this.success(message, loc);
  }
}
