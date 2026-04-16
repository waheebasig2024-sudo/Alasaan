/**
 * THE CORE PIPELINE: Tools First → Memory Second → Gemini Third → No Hallucination
 *
 * This is the main decision engine of AlHassan.
 */

import type { ParsedIntent } from "../types/intent.types";
import type { AppSettings } from "../types/settings.types";
import type { ChatMessage } from "../types/chat.types";
import { planExecution } from "./planner";
import { executeTool } from "../tools/tool-executor";
import { searchMemory } from "../memory/memory-search";
import { remember } from "../memory/memory-manager";
import { setUserName } from "../memory/personal-memory";
import { askGemini } from "./gemini-client";
import { reportToolAction, reportMemoryResult, reportGeminiResult } from "./action-reporter";
import { handleToolFailure, handleGeminiFailure } from "./fallback-manager";
import { buildWelcomeMessage } from "./personality";
import { logger } from "../utils/logger";

export interface PipelineResult {
  message: string;
  success: boolean;
  requiresConfirmation?: boolean;
  confirmationId?: string;
  toolName?: string;
  data?: unknown;
}

export async function runPipeline(
  intent: ParsedIntent,
  settings: AppSettings,
  history: ChatMessage[],
  userId: string
): Promise<PipelineResult> {
  const plan = planExecution(intent, settings);
  logger.info("pipeline", `Plan: ${plan.type}`);

  switch (plan.type) {
    case "greeting": {
      const message = await buildWelcomeMessage();
      return { message, success: true };
    }

    case "blocked": {
      return { message: plan.reason, success: false };
    }

    case "confirm": {
      return {
        message: plan.message,
        success: true,
        requiresConfirmation: true,
        confirmationId: plan.confirmationId,
      };
    }

    // STEP 1: Tools First
    case "tool": {
      logger.info("pipeline", `[TOOLS] Executing: ${plan.intent.toolIntent}`);
      const result = await executeTool(plan.intent, userId);

      if (!result) {
        return { message: "لم أجد أداة مناسبة لهذا الأمر", success: false };
      }

      if (!result.success) {
        const fallback = handleToolFailure(result.message, result.message);
        return { message: fallback.message, success: false };
      }

      const report = reportToolAction(result.message, result);
      return { message: report.message, success: true, data: result.data };
    }

    // STEP 2: Memory Second (SAVE)
    case "memory_save": {
      logger.info("pipeline", `[MEMORY SAVE] key: ${plan.key}`);
      try {
        // Special case: save user's name to profile
        if (plan.key === "الاسم") {
          await setUserName(plan.value);
          return {
            message: `حسناً، سأتذكر أن اسمك ${plan.value} ✓`,
            success: true,
          };
        }

        await remember(plan.key, plan.value, "personal");
        return {
          message: `تم الحفظ: "${plan.key}" = "${plan.value}" ✓`,
          success: true,
        };
      } catch (error) {
        logger.error("pipeline", "Memory save failed", error);
        return { message: "لم أتمكن من حفظ المعلومة", success: false };
      }
    }

    // STEP 2: Memory Second (LOOKUP)
    case "memory_lookup": {
      logger.info("pipeline", `[MEMORY] Searching: ${plan.query}`);
      const results = await searchMemory(plan.query);

      if (results.length > 0) {
        const top = results[0];
        const report = reportMemoryResult(true, plan.query, top.value);
        return { message: report.message, success: true };
      }

      // Memory miss → fall through to Gemini
      logger.info("pipeline", "[MEMORY] Miss, falling through to Gemini");
      const geminiResult = await askGemini({
        message: plan.intent.originalText,
        history,
      });

      if (!geminiResult.success) {
        const fallback = handleGeminiFailure(geminiResult.error);
        return { message: fallback.message, success: false };
      }

      return { message: geminiResult.text, success: true };
    }

    // STEP 3: Gemini Third
    case "gemini": {
      logger.info("pipeline", `[GEMINI] Asking: "${plan.message}"`);
      const geminiResult = await askGemini({
        message: plan.message,
        history,
      });

      if (!geminiResult.success || !geminiResult.text) {
        // STEP 4: No Hallucination
        const fallback = handleGeminiFailure(geminiResult.error);
        return { message: fallback.message, success: false };
      }

      const report = reportGeminiResult(true, geminiResult.text);
      return { message: report.message, success: true };
    }

    default: {
      return {
        message: "لم أفهم طلبك. هل يمكنك إعادة الصياغة؟",
        success: false,
      };
    }
  }
}

// Execute confirmed tool action (after user confirms)
export async function executeConfirmedAction(
  intent: ParsedIntent,
  userId: string
): Promise<PipelineResult> {
  logger.info("pipeline", `[TOOLS] Executing confirmed: ${intent.toolIntent}`);
  const result = await executeTool(intent, userId);

  if (!result) {
    return { message: "لم أتمكن من تنفيذ الأمر", success: false };
  }

  const report = reportToolAction(result.message, result);
  return { message: report.message, success: result.success };
}
