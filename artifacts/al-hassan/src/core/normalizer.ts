import { normalizeArabic, removeDiacritics } from "../utils/text";
import { DIALECT_MAP } from "../data/aliases.seed";

export function normalizeInput(input: string): string {
  let text = input.trim();

  // Replace dialect words
  for (const [dialect, standard] of Object.entries(DIALECT_MAP)) {
    const regex = new RegExp(`\\b${dialect}\\b`, "gi");
    text = text.replace(regex, standard);
  }

  // Remove diacritics
  text = removeDiacritics(text);

  return text;
}

export function extractMemorySaveEntities(text: string): { key: string; value: string } | null {
  // "اسمي محمد" → key: "الاسم", value: "محمد"
  const nameMatch = text.match(/اسمي\s+(.+)/i);
  if (nameMatch) return { key: "الاسم", value: nameMatch[1].trim() };

  // "عمري 25 سنة"
  const ageMatch = text.match(/عمري\s+(.+)/i);
  if (ageMatch) return { key: "العمر", value: ageMatch[1].trim() };

  // "أسكن في..."
  const cityMatch = text.match(/(?:أسكن|أعيش|مقيم)\s+(?:في|ب)\s+(.+)/i);
  if (cityMatch) return { key: "المدينة", value: cityMatch[1].trim() };

  // "عملي ... / أعمل في..."
  const jobMatch = text.match(/(?:عملي|أعمل\s+في|وظيفتي)\s+(.+)/i);
  if (jobMatch) return { key: "العمل", value: jobMatch[1].trim() };

  // "تخصصي..."
  const specMatch = text.match(/(?:تخصصي|تخصصي\s+هو)\s+(.+)/i);
  if (specMatch) return { key: "التخصص", value: specMatch[1].trim() };

  // "تذكر أن / احفظ أن X هو/هي Y"
  const rememberMatch = text.match(/(?:تذكر|احفظ|سجل|دون|اعلم)\s+أن?\s+(.+?)\s+(?:هو|هي|=|:)\s+(.+)/i);
  if (rememberMatch) return { key: rememberMatch[1].trim(), value: rememberMatch[2].trim() };

  // "تذكر X" simple
  const simpleMatch = text.match(/(?:تذكر|احفظ|سجل|دون)\s+(.+)/i);
  if (simpleMatch) return { key: simpleMatch[1].trim().substring(0, 40), value: simpleMatch[1].trim() };

  return null;
}

export function extractEntities(text: string): Record<string, string> {
  const entities: Record<string, string> = {};

  // Extract phone numbers
  const phoneMatch = text.match(/(\+?[\d\s\-]{7,15})/);
  if (phoneMatch) {
    entities.phone = phoneMatch[1].replace(/\s/g, "");
  }

  // Extract time references (minutes)
  const minutesMatch = text.match(/(\d+)\s*(دقيقة|دقائق|دق)/);
  if (minutesMatch) {
    entities.minutes = minutesMatch[1];
  }

  // Extract hours
  const hoursMatch = text.match(/(\d+)\s*(ساعة|ساعات)/);
  if (hoursMatch) {
    entities.minutes = String(parseInt(hoursMatch[1]) * 60);
  }

  // Extract app name after "افتح" or "شغل"
  const appMatch = text.match(/(?:افتح|شغل|تشغيل|دشغل)\s+(.+?)(?:\s|$)/i);
  if (appMatch) {
    entities.app = appMatch[1].trim();
  }

  // Extract contact name after "اتصل بـ" or "كلم"
  const callMatch = text.match(/(?:اتصل\s+(?:بـ|ب|على)|كلم|رن\s+على)\s+(.+?)(?:\s|$)/i);
  if (callMatch) {
    entities.contact = callMatch[1].trim();
  }

  // Extract "for" / destination after "في" or "إلى"
  const toMatch = text.match(/(?:إلى|الى|في|دلني\s+على)\s+(.+?)(?:\s|$)/i);
  if (toMatch) {
    entities.location = toMatch[1].trim();
  }

  // Extract note content after "اكتب" or "سجل" or "دون"
  const noteMatch = text.match(/(?:اكتب|سجل|دون|ملاحظة:?)\s+(.+)/i);
  if (noteMatch) {
    entities.content = noteMatch[1].trim();
    entities.title = noteMatch[1].trim().substring(0, 40);
  }

  // Extract reminder title
  const reminderMatch = text.match(/(?:ذكرني\s+بـ?|ذكرني\s+أن)\s+(.+?)(?:\s+بعد|\s|$)/i);
  if (reminderMatch) {
    entities.title = reminderMatch[1].trim();
  }

  // Extract search query
  const searchMatch = text.match(/(?:ابحث\s+(?:عن|في\s+الانترنت\s+عن)|جوجل)\s+(.+)/i);
  if (searchMatch) {
    entities.query = searchMatch[1].trim();
  }

  return entities;
}
