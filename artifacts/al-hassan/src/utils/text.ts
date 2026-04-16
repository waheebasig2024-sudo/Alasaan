const ARABIC_DIACRITICS_REGEX = /[\u064B-\u065F\u0670]/g;
const TATWEEL_REGEX = /\u0640/g;

export function removeDiacritics(text: string): string {
  return text.replace(ARABIC_DIACRITICS_REGEX, "").replace(TATWEEL_REGEX, "");
}

export function normalizeArabic(text: string): string {
  return text
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\u0621/g, "")
    .replace(ARABIC_DIACRITICS_REGEX, "")
    .replace(TATWEEL_REGEX, "")
    .trim()
    .toLowerCase();
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

export function isArabic(text: string): boolean {
  const arabicRegex = /[\u0600-\u06FF]/;
  return arabicRegex.test(text);
}

export function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substring(2, 9);
}
