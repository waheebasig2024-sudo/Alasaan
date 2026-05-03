import { normalizeArabic, removeDiacritics } from "../utils/text";
import { DIALECT_MAP } from "../data/aliases.seed";

export function normalizeInput(input: string): string {
  let text = input.trim();

  for (const [dialect, standard] of Object.entries(DIALECT_MAP)) {
    const regex = new RegExp(`\\b${dialect}\\b`, "gi");
    text = text.replace(regex, standard);
  }

  text = removeDiacritics(text);

  return text;
}

export function extractMemorySaveEntities(text: string): { key: string; value: string } | null {
  const nameMatch = text.match(/اسمي\s+(.+)/i);
  if (nameMatch) return { key: "الاسم", value: nameMatch[1].trim() };

  const ageMatch = text.match(/عمري\s+(.+)/i);
  if (ageMatch) return { key: "العمر", value: ageMatch[1].trim() };

  const cityMatch = text.match(/(?:أسكن|أعيش|مقيم)\s+(?:في|ب)\s+(.+)/i);
  if (cityMatch) return { key: "المدينة", value: cityMatch[1].trim() };

  const jobMatch = text.match(/(?:عملي|أعمل\s+في|وظيفتي)\s+(.+)/i);
  if (jobMatch) return { key: "العمل", value: jobMatch[1].trim() };

  const specMatch = text.match(/(?:تخصصي|تخصصي\s+هو)\s+(.+)/i);
  if (specMatch) return { key: "التخصص", value: specMatch[1].trim() };

  const rememberMatch = text.match(/(?:تذكر|احفظ|سجل|دون|اعلم)\s+أن?\s+(.+?)\s+(?:هو|هي|=|:)\s+(.+)/i);
  if (rememberMatch) return { key: rememberMatch[1].trim(), value: rememberMatch[2].trim() };

  const simpleMatch = text.match(/(?:تذكر|احفظ|سجل|دون)\s+(.+)/i);
  if (simpleMatch) return { key: simpleMatch[1].trim().substring(0, 40), value: simpleMatch[1].trim() };

  return null;
}

export function extractEntities(text: string): Record<string, string> {
  const entities: Record<string, string> = {};

  // Phone numbers
  const phoneMatch = text.match(/(\+?[\d\s\-]{7,15})/);
  if (phoneMatch) {
    entities.phone = phoneMatch[1].replace(/\s/g, "");
  }

  // Time: minutes
  const minutesMatch = text.match(/(\d+)\s*(دقيقة|دقائق|دق)/);
  if (minutesMatch) {
    entities.minutes = minutesMatch[1];
  }

  // Time: hours → convert to minutes
  const hoursMatch = text.match(/(\d+)\s*(ساعة|ساعات)/);
  if (hoursMatch) {
    entities.minutes = String(parseInt(hoursMatch[1]) * 60);
  }

  // App name after "افتح/شغل" — but only if NOT followed by location/contact keywords
  const appMatch = text.match(/(?:افتح|شغل|تشغيل|دشغل)\s+([^\s].+?)(?:\s*$)/i);
  if (appMatch) {
    entities.app = appMatch[1].trim();
  }

  // Contact name after call trigger — capture full name
  const callMatch = text.match(/(?:اتصل\s+(?:بـ|ب|على|في)|كلم|رن\s+على)\s+(.+)/i);
  if (callMatch) {
    entities.contact = callMatch[1].trim();
  }

  // Message recipient + body — "ارسل رسالة لمحمد: مرحبا"
  const msgFullMatch = text.match(
    /(?:ارسل|ابعث)\s+(?:رسالة|واتساب|مسج)?\s*(?:لـ|ل|إلى|الى)\s+(.+?)\s*(?:قول|قل|نص|:)\s*(.+)/i
  );
  if (msgFullMatch) {
    entities.contact = msgFullMatch[1].trim();
    entities.message = msgFullMatch[2].trim();
  } else {
    // "ارسل رسالة لمحمد" — just recipient
    const msgSimpleMatch = text.match(
      /(?:ارسل|ابعث|راسل)\s+(?:رسالة|واتساب|مسج)?\s*(?:لـ|ل|إلى|الى)\s+(.+)/i
    );
    if (msgSimpleMatch) {
      entities.contact = msgSimpleMatch[1].trim();
    }
  }

  // Location: after "إلى/في/دلني على"
  const toMatch = text.match(/(?:إلى|الى|في|دلني\s+على)\s+(.+?)(?:\s*$)/i);
  if (toMatch) {
    entities.location = toMatch[1].trim();
  }

  // Note content
  const noteMatch = text.match(/(?:اكتب|سجل|دون|ملاحظة:?)\s+(.+)/i);
  if (noteMatch) {
    entities.content = noteMatch[1].trim();
    entities.title = noteMatch[1].trim().substring(0, 40);
  }

  // Reminder title: "ذكرني بـ X بعد..."
  const reminderMatch = text.match(/(?:ذكرني|ذكّرني|نبهني)\s+(?:بـ?|أن|ب)?\s*(.+?)(?:\s+بعد|\s*$)/i);
  if (reminderMatch) {
    entities.title = reminderMatch[1].trim();
  }

  // Search query
  const searchMatch = text.match(/(?:ابحث\s+(?:عن|في\s+الانترنت\s+عن|في\s+جوجل\s+عن)|جوجل|بحث\s+عن)\s+(.+)/i);
  if (searchMatch) {
    entities.query = searchMatch[1].trim();
  }

  return entities;
}
