/**
 * AlHassan Router - The top-level entry point
 *
 * Pipeline order:
 * 1. Tools First  (executable commands)
 * 2. Memory Second (personal data)
 * 3. Gemini Third  (general questions)
 * 4. No Hallucination on failure
 */

import type { ChatMessage } from "../types/chat.types";
import type { AppSettings } from "../types/settings.types";
import { parseCommand } from "./command-parser";
import { enrichIntentWithContext, updateContextAfterTurn } from "./context-manager";
import { runPipeline } from "./execution-pipeline";
import { createMessage, addMessage } from "./chat-session";
import { logger } from "../utils/logger";

export interface RouterInput {
  text: string;
  sessionId: string;
  userId: string;
  settings: AppSettings;
  history: ChatMessage[];
}

export interface RouterOutput {
  message: string;
  success: boolean;
  requiresConfirmation?: boolean;
  confirmationId?: string;
  pendingIntent?: unknown;
}

export async function processMessage(input: RouterInput): Promise<RouterOutput> {
  const { text, sessionId, userId, settings, history } = input;
  logger.info("router", `Processing: "${text.substring(0, 50)}"`);

  // Parse the command
  const { intent } = parseCommand(text);

  // Enrich with conversation context
  const enrichedIntent = await enrichIntentWithContext(sessionId, intent);

  // Save user message
  const userMsg = createMessage("user", text);
  await addMessage(userMsg);

  // Run the pipeline: Tools → Memory → Gemini → No Hallucination
  const result = await runPipeline(enrichedIntent, settings, history, userId);

  // Update context after processing
  await updateContextAfterTurn(sessionId, enrichedIntent);

  // Save assistant response
  if (result.requiresConfirmation) {
    const confirmMsg = createMessage("assistant", result.message, {
      contentType: "confirmation-request",
      confirmationData: {
        actionId: result.confirmationId ?? "",
        actionDescription: result.message,
      },
    });
    await addMessage(confirmMsg);
  } else {
    const assistantMsg = createMessage("assistant", result.message, {
      contentType: result.success ? "text" : "error",
    });
    await addMessage(assistantMsg);
  }

  return {
    message: result.message,
    success: result.success,
    requiresConfirmation: result.requiresConfirmation,
    confirmationId: result.confirmationId,
    pendingIntent: result.requiresConfirmation ? enrichedIntent : undefined,
  };
}
