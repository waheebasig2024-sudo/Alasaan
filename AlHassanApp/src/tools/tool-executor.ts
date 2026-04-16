import type { ParsedIntent } from "../types/intent.types";
import type { ToolResult } from "../types/tool.types";
import { selectTool } from "./tool-selector";
import { recordExecution } from "../memory/execution-memory";
import { logger } from "../utils/logger";

export async function executeTool(
  intent: ParsedIntent,
  userId: string
): Promise<ToolResult | null> {
  if (!intent.toolIntent) return null;

  const tool = await selectTool(intent);
  if (!tool) return null;

  logger.info("tool-executor", `Executing: ${tool.name}`);

  const result = await tool.execute({
    intent: intent.toolIntent,
    entities: intent.entities,
    originalText: intent.originalText,
    userId,
  });

  await recordExecution(tool.name, intent.originalText, result);
  return result;
}
