/**
 * Tests: memory/memory-manager.ts
 * Tests the core remember/recall/forget operations.
 */

import { remember, recall, forget, getAllMemories } from "../../src/memory/memory-manager";

jest.mock("../../src/memory/schemas", () => ({
  loadMemoryEntries: jest.fn().mockResolvedValue([]),
  saveMemoryEntries: jest.fn().mockResolvedValue(undefined),
}));

import { loadMemoryEntries, saveMemoryEntries } from "../../src/memory/schemas";

const mockLoad = loadMemoryEntries as jest.Mock;
const mockSave = saveMemoryEntries as jest.Mock;

describe("Memory Manager", () => {
  beforeEach(() => {
    mockLoad.mockResolvedValue([]);
    mockSave.mockResolvedValue(undefined);
  });

  test("remember saves a new entry", async () => {
    const entry = await remember("الاسم", "محمد", "personal");
    expect(entry.key).toBe("الاسم");
    expect(entry.value).toBe("محمد");
    expect(entry.category).toBe("personal");
    expect(entry.id).toBeTruthy();
    expect(mockSave).toHaveBeenCalled();
  });

  test("remember updates existing entry", async () => {
    const existing = {
      id: "1",
      key: "الاسم",
      value: "خالد",
      category: "personal" as const,
      tags: [],
      confidence: 1.0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastAccessedAt: Date.now(),
    };
    mockLoad.mockResolvedValue([existing]);

    const updated = await remember("الاسم", "محمد", "personal");
    expect(updated.value).toBe("محمد");
    expect(updated.id).toBe("1");
  });

  test("recall returns null when not found", async () => {
    const result = await recall("غير موجود");
    expect(result).toBeNull();
  });

  test("recall returns entry when found", async () => {
    const entry = {
      id: "1",
      key: "المدينة",
      value: "الرياض",
      category: "personal" as const,
      tags: [],
      confidence: 1.0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastAccessedAt: Date.now(),
    };
    mockLoad.mockResolvedValue([entry]);

    const result = await recall("المدينة");
    expect(result).not.toBeNull();
    expect(result?.value).toBe("الرياض");
  });

  test("forget removes entry and returns true", async () => {
    const entry = {
      id: "1",
      key: "المدينة",
      value: "الرياض",
      category: "personal" as const,
      tags: [],
      confidence: 1.0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastAccessedAt: Date.now(),
    };
    mockLoad.mockResolvedValue([entry]);

    const result = await forget("المدينة");
    expect(result).toBe(true);
    expect(mockSave).toHaveBeenCalledWith([]);
  });

  test("forget returns false when key not found", async () => {
    const result = await forget("غير موجود");
    expect(result).toBe(false);
  });

  test("getAllMemories returns all entries", async () => {
    const entries = [
      { id: "1", key: "a", value: "1", category: "personal" as const, tags: [], confidence: 1, createdAt: 0, updatedAt: 0, lastAccessedAt: 0 },
      { id: "2", key: "b", value: "2", category: "personal" as const, tags: [], confidence: 1, createdAt: 0, updatedAt: 0, lastAccessedAt: 0 },
    ];
    mockLoad.mockResolvedValue(entries);
    const result = await getAllMemories();
    expect(result).toHaveLength(2);
  });
});
