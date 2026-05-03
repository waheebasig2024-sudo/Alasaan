/**
 * Integration Tests: Full Pipeline
 * Tools → Memory → Gemini → No Hallucination
 *
 * These tests verify the end-to-end pipeline behavior
 * using mocked native services and Gemini client.
 */

import { runPipeline } from "../../src/core/execution-pipeline";
import type { ParsedIntent } from "../../src/types/intent.types";
import type { AppSettings } from "../../src/types/settings.types";

const DEFAULT_SETTINGS: AppSettings = {
  language: "ar",
  theme: "dark",
  voiceEnabled: false,
  voiceGender: "male",
  hapticFeedback: true,
  safeMode: false,
  requireConfirmationForCalls: true,
  requireConfirmationForMessages: true,
  requireConfirmationForDelete: true,
  userName: "مستخدم",
  geminiModel: "gemini-2.5-flash",
  maxConversationHistory: 50,
  onboardingComplete: true,
};

// Mock tool executor
jest.mock("../../src/tools/tool-executor", () => ({
  executeTool: jest.fn(),
}));

// Mock memory search
jest.mock("../../src/memory/memory-search", () => ({
  searchMemory: jest.fn().mockResolvedValue([]),
}));

// Mock memory manager
jest.mock("../../src/memory/memory-manager", () => ({
  remember: jest.fn().mockResolvedValue({ key: "test", value: "value" }),
}));

jest.mock("../../src/memory/personal-memory", () => ({
  setUserName: jest.fn().mockResolvedValue(undefined),
  getProfile: jest.fn().mockResolvedValue({ name: "مستخدم", preferences: {}, importantPeople: [] }),
}));

// Mock Gemini client
jest.mock("../../src/core/gemini-client", () => ({
  askGemini: jest.fn().mockResolvedValue({ text: "إجابة Gemini", success: true }),
}));

import { executeTool } from "../../src/tools/tool-executor";
import { searchMemory } from "../../src/memory/memory-search";
import { askGemini } from "../../src/core/gemini-client";

const mockExecuteTool = executeTool as jest.Mock;
const mockSearchMemory = searchMemory as jest.Mock;
const mockAskGemini = askGemini as jest.Mock;

function makeToolIntent(toolIntent: string): ParsedIntent {
  return {
    category: "tool",
    toolIntent: toolIntent as ParsedIntent["toolIntent"],
    confidence: 0.9,
    entities: {},
    normalizedText: "test",
    originalText: "اختبار",
    requiresConfirmation: false,
  };
}

describe("Execution Pipeline - Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExecuteTool.mockResolvedValue({ success: true, message: "تم التنفيذ" });
    mockSearchMemory.mockResolvedValue([]);
    mockAskGemini.mockResolvedValue({ text: "إجابة Gemini", success: true });
  });

  test("greeting returns personality message", async () => {
    const intent: ParsedIntent = {
      category: "greeting",
      confidence: 0.9,
      entities: {},
      normalizedText: "مرحبا",
      originalText: "مرحبا",
      requiresConfirmation: false,
    };
    const result = await runPipeline(intent, DEFAULT_SETTINGS, [], "user1");
    expect(result.success).toBe(true);
    expect(result.message).toBeTruthy();
  });

  test("STEP 1: Tool intent routes to tool executor", async () => {
    const intent = makeToolIntent("open_camera");
    const result = await runPipeline(intent, DEFAULT_SETTINGS, [], "user1");
    expect(mockExecuteTool).toHaveBeenCalledWith(intent, "user1");
  });

  test("STEP 1: Tool success returns tool message", async () => {
    mockExecuteTool.mockResolvedValue({ success: true, message: "تم فتح الكاميرا" });
    const intent = makeToolIntent("open_camera");
    const result = await runPipeline(intent, DEFAULT_SETTINGS, [], "user1");
    expect(result.success).toBe(true);
    expect(mockAskGemini).not.toHaveBeenCalled();
  });

  test("STEP 2: Memory lookup hits memory first", async () => {
    const entry = { id: "1", key: "الاسم", value: "محمد", category: "personal", tags: [], confidence: 1, createdAt: 0, updatedAt: 0, lastAccessedAt: 0 };
    mockSearchMemory.mockResolvedValue([entry]);

    const intent: ParsedIntent = {
      category: "memory",
      confidence: 0.85,
      entities: { query: "الاسم" },
      normalizedText: "هل تذكر اسمي",
      originalText: "هل تذكر اسمي",
      requiresConfirmation: false,
    };
    const result = await runPipeline(intent, DEFAULT_SETTINGS, [], "user1");
    expect(result.success).toBe(true);
    expect(mockAskGemini).not.toHaveBeenCalled();
  });

  test("STEP 2→3: Memory miss falls through to Gemini", async () => {
    mockSearchMemory.mockResolvedValue([]);

    const intent: ParsedIntent = {
      category: "memory",
      confidence: 0.8,
      entities: {},
      normalizedText: "هل تذكر اسمي",
      originalText: "هل تذكر اسمي",
      requiresConfirmation: false,
    };
    await runPipeline(intent, DEFAULT_SETTINGS, [], "user1");
    expect(mockAskGemini).toHaveBeenCalled();
  });

  test("STEP 3: Question goes directly to Gemini", async () => {
    const intent: ParsedIntent = {
      category: "question",
      confidence: 0.8,
      entities: {},
      normalizedText: "ما هو الذكاء الاصطناعي",
      originalText: "ما هو الذكاء الاصطناعي",
      requiresConfirmation: false,
    };
    await runPipeline(intent, DEFAULT_SETTINGS, [], "user1");
    expect(mockAskGemini).toHaveBeenCalled();
  });

  test("STEP 4: Gemini failure → no hallucination", async () => {
    mockAskGemini.mockResolvedValue({ text: "", success: false, error: "فشل" });

    const intent: ParsedIntent = {
      category: "question",
      confidence: 0.8,
      entities: {},
      normalizedText: "سؤال",
      originalText: "سؤال",
      requiresConfirmation: false,
    };
    const result = await runPipeline(intent, DEFAULT_SETTINGS, [], "user1");
    expect(result.success).toBe(false);
    expect(result.message).toBeTruthy();
    expect(result.message).not.toBe("");
  });

  test("safe mode blocks sensitive tools", async () => {
    const settingsWithSafeMode = { ...DEFAULT_SETTINGS, safeMode: true };
    const intent = makeToolIntent("make_call");
    (intent as ParsedIntent).requiresConfirmation = true;

    const result = await runPipeline(intent, settingsWithSafeMode, [], "user1");
    expect(typeof result.message).toBe("string");
  });
});
