/**
 * Tests: core/router.ts
 * Pipeline: Tools → Memory → Gemini → No Hallucination
 */

import { processMessage } from "../../src/core/router";
import type { RouterInput } from "../../src/core/router";
import type { AppSettings } from "../../src/types/settings.types";

const DEFAULT_SETTINGS: AppSettings = {
  language: "ar",
  theme: "dark",
  voiceEnabled: false,
  voiceGender: "male",
  hapticFeedback: true,
  safeMode: true,
  requireConfirmationForCalls: true,
  requireConfirmationForMessages: true,
  requireConfirmationForDelete: true,
  userName: "مستخدم",
  geminiModel: "gemini-2.5-flash",
  maxConversationHistory: 50,
  onboardingComplete: true,
};

function makeInput(text: string): RouterInput {
  return {
    text,
    sessionId: "test-session",
    userId: "test-user",
    settings: DEFAULT_SETTINGS,
    history: [],
  };
}

describe("processMessage - Router Pipeline", () => {
  test("greeting returns welcome message", async () => {
    const result = await processMessage(makeInput("مرحبا"));
    expect(result.success).toBe(true);
    expect(result.message).toBeTruthy();
    expect(typeof result.message).toBe("string");
  });

  test("call command requires confirmation", async () => {
    const result = await processMessage(makeInput("اتصل بأحمد"));
    expect(result.requiresConfirmation).toBe(true);
    expect(result.confirmationId).toBeTruthy();
  });

  test("reminder command succeeds", async () => {
    const result = await processMessage(makeInput("ذكرني بعد 30 دقيقة بشرب الماء"));
    expect(typeof result.message).toBe("string");
  });

  test("memory save extracts and stores info", async () => {
    const result = await processMessage(makeInput("تذكر أن اسمي محمد"));
    expect(result.success).toBe(true);
    expect(result.message).toContain("محمد");
  });

  test("empty input handled gracefully", async () => {
    const result = await processMessage(makeInput("   "));
    expect(typeof result.message).toBe("string");
  });
});
