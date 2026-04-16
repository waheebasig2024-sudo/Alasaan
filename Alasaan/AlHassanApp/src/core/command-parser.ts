import type { ParsedIntent } from "../types/intent.types";
import { classifyIntent } from "./intent-classifier";
import { sanitizeInput } from "../security/validator";
import { logger } from "../utils/logger";

export interface ParseResult {
  intent: ParsedIntent;
  rawInput: string;
  sanitizedInput: string;
}

export function parseCommand(input: string): ParseResult {
  const sanitized = sanitizeInput(input);
  logger.debug("command-parser", `Parsing: "${sanitized}"`);
  const intent = classifyIntent(sanitized);
  logger.debug("command-parser", `Intent: ${intent.category}/${intent.toolIntent ?? "none"} (${intent.confidence.toFixed(2)})`);

  return {
    intent,
    rawInput: input,
    sanitizedInput: sanitized,
  };
}

export function isContextualReference(text: string): boolean {
  const contextWords = ["له", "لها", "لهم", "عليه", "عليها", "فيه", "فيها", "إليه", "إليها", "ذلك", "هذا", "هذه"];
  return contextWords.some((w) => text.includes(w));
}
