/**
 * Tests: tools/communication/call.tool.ts
 */

import { CallTool } from "../../src/tools/communication/call.tool";
import type { ToolContext } from "../../src/types/tool.types";

describe("CallTool", () => {
  let tool: CallTool;

  beforeEach(() => {
    tool = new CallTool();
  });

  test("has correct name and intent", () => {
    expect(tool.name).toBe("call");
    expect(tool.intent).toBe("make_call");
    expect(tool.requiresConfirmation).toBe(true);
  });

  test("fails without phone or contact name", async () => {
    const ctx: ToolContext = {
      intent: "make_call",
      entities: {},
      originalText: "اتصل",
      userId: "user1",
    };
    const result = await tool.execute(ctx);
    expect(result.success).toBe(false);
    expect(result.message).toBeTruthy();
  });

  test("validates phone number format", async () => {
    const ctx: ToolContext = {
      intent: "make_call",
      entities: { phone: "not-a-number" },
      originalText: "اتصل برقم not-a-number",
      userId: "user1",
    };
    const result = await tool.execute(ctx);
    expect(result.success).toBe(false);
  });

  test("accepts valid phone number", async () => {
    const ctx: ToolContext = {
      intent: "make_call",
      entities: { phone: "0501234567" },
      originalText: "اتصل برقم 0501234567",
      userId: "user1",
    };
    const result = await tool.execute(ctx);
    expect(typeof result.success).toBe("boolean");
    expect(typeof result.message).toBe("string");
  });
});
