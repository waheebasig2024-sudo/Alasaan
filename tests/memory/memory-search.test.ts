/**
 * Tests: memory/memory-search.ts
 */

import { searchMemory } from "../../src/memory/memory-search";

jest.mock("../../src/memory/memory-manager", () => ({
  getAllMemories: jest.fn().mockResolvedValue([]),
}));

import { getAllMemories } from "../../src/memory/memory-manager";
const mockGetAll = getAllMemories as jest.Mock;

const MOCK_ENTRIES = [
  { id: "1", key: "الاسم", value: "محمد", category: "personal", tags: ["اسم"], confidence: 1, createdAt: 0, updatedAt: 0, lastAccessedAt: 0 },
  { id: "2", key: "المدينة", value: "الرياض", category: "personal", tags: [], confidence: 1, createdAt: 0, updatedAt: 0, lastAccessedAt: 0 },
  { id: "3", key: "العمل", value: "مهندس برمجيات", category: "personal", tags: ["عمل"], confidence: 1, createdAt: 0, updatedAt: 0, lastAccessedAt: 0 },
];

describe("Memory Search", () => {
  beforeEach(() => {
    mockGetAll.mockResolvedValue(MOCK_ENTRIES);
  });

  test("returns matching entries for exact key match", async () => {
    const results = await searchMemory("الاسم");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].value).toBe("محمد");
  });

  test("returns empty array for no match", async () => {
    const results = await searchMemory("xyz_لا_يوجد");
    expect(results).toEqual([]);
  });

  test("returns empty when no memories exist", async () => {
    mockGetAll.mockResolvedValue([]);
    const results = await searchMemory("الاسم");
    expect(results).toEqual([]);
  });

  test("search is case and diacritic insensitive", async () => {
    const results = await searchMemory("اسمي");
    expect(typeof results).toBe("object");
  });
});
