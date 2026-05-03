/**
 * Tests: core/intent-classifier.ts
 */

import { classifyIntent } from "../../src/core/intent-classifier";

describe("classifyIntent", () => {
  describe("Greetings", () => {
    test("مرحبا → greeting", () => {
      const result = classifyIntent("مرحبا");
      expect(result.category).toBe("greeting");
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    test("السلام عليكم → greeting", () => {
      const result = classifyIntent("السلام عليكم");
      expect(result.category).toBe("greeting");
    });

    test("hi → greeting", () => {
      const result = classifyIntent("hi");
      expect(result.category).toBe("greeting");
    });
  });

  describe("Tool Intents", () => {
    test("افتح الكاميرا → tool", () => {
      const result = classifyIntent("افتح الكاميرا");
      expect(result.category).toBe("tool");
      expect(result.toolIntent).toBeTruthy();
    });

    test("اتصل بأحمد → tool (make_call)", () => {
      const result = classifyIntent("اتصل بأحمد");
      expect(result.category).toBe("tool");
      expect(result.requiresConfirmation).toBe(true);
    });

    test("ذكرني بعد ساعة → tool (set_reminder)", () => {
      const result = classifyIntent("ذكرني بعد ساعة");
      expect(result.category).toBe("tool");
    });
  });

  describe("Memory Intents", () => {
    test("تذكر أن اسمي خالد → memory_save", () => {
      const result = classifyIntent("تذكر أن اسمي خالد");
      expect(result.category).toBe("memory_save");
    });

    test("احفظ رقم البيت هو 1234 → memory_save", () => {
      const result = classifyIntent("احفظ رقم البيت هو 1234");
      expect(result.category).toBe("memory_save");
    });

    test("هل تذكر اسمي → memory", () => {
      const result = classifyIntent("هل تذكر اسمي");
      expect(result.category).toBe("memory");
    });
  });

  describe("Questions → Gemini", () => {
    test("ما هو الذكاء الاصطناعي → question", () => {
      const result = classifyIntent("ما هو الذكاء الاصطناعي");
      expect(result.category).toBe("question");
    });

    test("كيف أتعلم البرمجة → question", () => {
      const result = classifyIntent("كيف أتعلم البرمجة");
      expect(result.category).toBe("question");
    });
  });
});
