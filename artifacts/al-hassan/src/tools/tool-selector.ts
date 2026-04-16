import type { ParsedIntent } from "../types/intent.types";
import type { Tool } from "../types/tool.types";
import { ALL_TOOLS } from "./index";
import { logger } from "../utils/logger";

export async function selectTool(intent: ParsedIntent): Promise<Tool | null> {
  if (!intent.toolIntent) return null;

  const tool = ALL_TOOLS.find((t) => t.intent === intent.toolIntent);
  if (!tool) {
    logger.warn("tool-selector", `No tool for intent: ${intent.toolIntent}`);
    return null;
  }

  const available = await tool.isAvailable();
  if (!available) {
    logger.warn("tool-selector", `Tool not available: ${tool.name}`);
    return null;
  }

  return tool;
}
