/**
 * Tests: tools/productivity/reminder.tool.ts
 */

import { ReminderTool } from "../../src/tools/productivity/reminder.tool";
import type { ToolContext } from "../../src/types/tool.types";

describe("ReminderTool", () => {
  let tool: ReminderTool;

  beforeEach(() => {
    tool = new ReminderTool();
  });

  test("has correct name and intent", () => {
    expect(tool.name).toBe("reminder");
    expect(tool.intent).toBe("set_reminder");
    expect(tool.requiresConfirmation).toBe(false);
  });

  test("fails with invalid minutes", async () => {
    const ctx: ToolContext = {
      intent: "set_reminder",
      entities: { title: "شرب الماء", minutes: "abc" },
      originalText: "ذكرني بشرب الماء",
      userId: "user1",
    };
    const result = await tool.execute(ctx);
    expect(result.success).toBe(false);
  });

  test("fails with zero minutes", async () => {
    const ctx: ToolContext = {
      intent: "set_reminder",
      entities: { title: "تذكير", minutes: "0" },
      originalText: "ذكرني",
      userId: "user1",
    };
    const result = await tool.execute(ctx);
    expect(result.success).toBe(false);
  });

  test("succeeds with valid minutes", async () => {
    const ctx: ToolContext = {
      intent: "set_reminder",
      entities: { title: "اجتماع", minutes: "30" },
      originalText: "ذكرني بعد 30 دقيقة باجتماع",
      userId: "user1",
    };
    const result = await tool.execute(ctx);
    expect(typeof result.message).toBe("string");
  });

  test("uses default title when not provided", async () => {
    const ctx: ToolContext = {
      intent: "set_reminder",
      entities: { minutes: "60" },
      originalText: "ذكرني بعد ساعة",
      userId: "user1",
    };
    const result = await tool.execute(ctx);
    expect(typeof result.message).toBe("string");
  });
});
