import type { ParsedIntent, IntentCategory, ToolIntent } from "../types/intent.types";
import { INTENT_PATTERNS } from "../data/intents.seed";
import { normalizeArabic } from "../utils/text";
import { extractEntities, normalizeInput, extractMemorySaveEntities } from "./normalizer";

const QUESTION_KEYWORDS = [
  "ما", "من", "كيف", "متى", "لماذا", "هل", "أين", "أي",
  "شرح", "اشرح", "وضح", "ما هو", "ما هي", "ما معنى",
  "ما هو", "من هو", "ما اسم", "أخبرني عن", "حدثني عن",
];

const GREETING_KEYWORDS = [
  "السلام", "مرحبا", "مرحباً", "أهلاً", "أهلا", "صباح", "مساء", "كيف حالك",
  "هلو", "هاي", "hi", "hello",
];

const MEMORY_SAVE_KEYWORDS = [
  "تذكر أن", "تذكّر أن", "احفظ أن", "احفظ",
  "سجل أن", "دون أن", "اعلم أن", "خزن",
  "اسمي", "عمري", "أسكن", "عملي", "تخصصي",
  "أنا من", "أعمل في", "أحب", "أفضل",
];

const MEMORY_LOOKUP_KEYWORDS = [
  "هل تذكر", "هل تعرف", "أخبرني عن", "ماذا تعرف عن",
  "ما هو المحفوظ", "ما الذي تعرفه", "هل حفظت",
];

function matchesPattern(text: string, patterns: string[]): number {
  const normalized = normalizeArabic(text);
  let maxScore = 0;

  for (const pattern of patterns) {
    const normalizedPattern = normalizeArabic(pattern);
    if (normalized.includes(normalizedPattern)) {
      const score = normalizedPattern.length / normalized.length;
      maxScore = Math.max(maxScore, score + 0.3);
    }
  }

  return Math.min(maxScore, 1.0);
}

export function classifyIntent(rawInput: string): ParsedIntent {
  const normalized = normalizeInput(rawInput);
  const entities = extractEntities(rawInput);

  // Check greetings first
  for (const kw of GREETING_KEYWORDS) {
    if (normalized.toLowerCase().includes(kw.toLowerCase())) {
      return {
        category: "greeting",
        confidence: 0.9,
        entities,
        normalizedText: normalized,
        originalText: rawInput,
        requiresConfirmation: false,
      };
    }
  }

  // Check memory LOOKUP keywords FIRST (higher priority than save)
  for (const kw of MEMORY_LOOKUP_KEYWORDS) {
    if (normalized.includes(kw)) {
      return {
        category: "memory",
        confidence: 0.85,
        entities,
        normalizedText: normalized,
        originalText: rawInput,
        requiresConfirmation: false,
      };
    }
  }

  // Check memory SAVE keywords
  for (const kw of MEMORY_SAVE_KEYWORDS) {
    if (normalized.includes(kw)) {
      const saveData = extractMemorySaveEntities(rawInput);
      const enrichedEntities = {
        ...entities,
        ...(saveData ? { memoryKey: saveData.key, memoryValue: saveData.value } : {}),
      };
      return {
        category: "memory_save",
        confidence: 0.85,
        entities: enrichedEntities,
        normalizedText: normalized,
        originalText: rawInput,
        requiresConfirmation: false,
      };
    }
  }

  // Try to match tool intents
  let bestToolIntent: ToolIntent | null = null;
  let bestScore = 0;
  let requiresConfirmation = false;

  for (const pattern of INTENT_PATTERNS) {
    const score = matchesPattern(normalized, pattern.patterns);
    if (score > bestScore && score > 0.25) {
      bestScore = score;
      bestToolIntent = pattern.intent;
      requiresConfirmation = pattern.requiresConfirmation;
    }
  }

  if (bestToolIntent && bestScore > 0.25) {
    return {
      category: "tool",
      toolIntent: bestToolIntent,
      confidence: bestScore,
      entities,
      normalizedText: normalized,
      originalText: rawInput,
      requiresConfirmation,
    };
  }

  // Check question keywords
  for (const kw of QUESTION_KEYWORDS) {
    if (normalized.startsWith(kw) || normalized.includes(` ${kw} `) || normalized.includes(` ${kw}`)) {
      return {
        category: "question",
        confidence: 0.8,
        entities,
        normalizedText: normalized,
        originalText: rawInput,
        requiresConfirmation: false,
      };
    }
  }

  // Default: send to Gemini for general questions/conversation
  return {
    category: "question",
    confidence: 0.5,
    entities,
    normalizedText: normalized,
    originalText: rawInput,
    requiresConfirmation: false,
  };
}
