import type { ToolIntent } from "../types/intent.types";

export interface IntentPattern {
  intent: ToolIntent;
  patterns: string[];
  requiresConfirmation: boolean;
}

export const INTENT_PATTERNS: IntentPattern[] = [
  {
    intent: "open_camera",
    patterns: [
      "افتح الكاميرا", "كاميرا", "خذ صورة", "تصوير", "صور", "التقط",
      "سيلفي", "فوتو", "photo", "camera",
    ],
    requiresConfirmation: false,
  },
  {
    intent: "take_photo",
    patterns: [
      "التقط صورة", "فوتو", "سيلفي", "صورة",
    ],
    requiresConfirmation: false,
  },
  {
    intent: "make_call",
    patterns: [
      "اتصل بـ", "اتصل ب", "كلم", "رن على", "تليفون",
      "اتصال بـ", "اتصال ب", "call",
    ],
    requiresConfirmation: true,
  },
  {
    intent: "send_message",
    patterns: [
      "ارسل رسالة", "ارسل واتساب", "ارسل واتس", "راسل", "مسج",
      "ابعث رسالة", "ابعث واتساب", "ابعث واتس", "send message",
      "وتساب", "واتس اب",
    ],
    requiresConfirmation: true,
  },
  {
    intent: "open_maps",
    patterns: [
      "افتح الخرائط", "خرائط", "دلني على", "روت", "مسار",
      "طريق", "كيف أصل", "اوصل", "خريطة", "maps",
      "وين", "أين يقع",
    ],
    requiresConfirmation: false,
  },
  {
    intent: "set_reminder",
    patterns: [
      "ذكرني", "تذكير", "نبهني", "منبه", "ضع تنبيه",
      "ذكرني بعد", "نبهني بعد", "تذكير بعد", "ذكّرني",
      "set reminder", "remind me",
    ],
    requiresConfirmation: false,
  },
  {
    intent: "set_alarm",
    patterns: [
      "منبه الساعة", "أيقظني", "نبهني الساعة", "ضع منبه",
      "اجعل المنبه", "المنبه",
    ],
    requiresConfirmation: false,
  },
  {
    intent: "search_contacts",
    patterns: [
      "ابحث في جهات الاتصال", "دور على رقم", "جهة اتصال",
      "رقم هاتف", "رقم تليفون", "ابحث عن رقم",
    ],
    requiresConfirmation: false,
  },
  {
    intent: "open_app",
    patterns: [
      "افتح", "شغل", "تشغيل", "دشغل", "افتح تطبيق",
      "open", "launch",
    ],
    requiresConfirmation: false,
  },
  {
    intent: "open_gallery",
    patterns: [
      "الصور", "المعرض", "gallery", "استعرض الصور",
      "اعرض الصور", "معرض الصور",
    ],
    requiresConfirmation: false,
  },
  {
    intent: "get_location",
    patterns: [
      "وين أنا", "موقعي", "أين أنا", "إحداثياتي",
      "مكاني", "موقعي الحالي", "عنواني",
    ],
    requiresConfirmation: false,
  },
  {
    intent: "search_web",
    patterns: [
      "ابحث في الانترنت", "ابحث في الإنترنت", "جوجل",
      "بحث عن", "بحث في جوجل", "سيرش",
      "ابحث عن", "دور في الانترنت",
    ],
    requiresConfirmation: false,
  },
  {
    intent: "open_browser",
    patterns: [
      "افتح المتصفح", "افتح موقع", "تصفح", "متصفح",
      "افتح الإنترنت", "browser",
    ],
    requiresConfirmation: false,
  },
  {
    intent: "create_note",
    patterns: [
      "اكتب ملاحظة", "سجل ملاحظة", "دون ملاحظة", "ملاحظة جديدة",
      "اكتب", "سجل", "دون", "note",
    ],
    requiresConfirmation: false,
  },
  {
    intent: "read_notes",
    patterns: [
      "اعرض الملاحظات", "ملاحظاتي", "ما الملاحظات",
      "اقرأ الملاحظات", "show notes",
    ],
    requiresConfirmation: false,
  },
  {
    intent: "schedule_event",
    patterns: [
      "أضف موعد", "تقويم", "اجتماع", "حدث جديد",
      "موعد", "أضف إلى التقويم", "calendar",
    ],
    requiresConfirmation: false,
  },
  {
    intent: "record_audio",
    patterns: [
      "سجل صوت", "تسجيل صوتي", "تسجيل صوت",
      "سجل ملاحظة صوتية", "record audio",
    ],
    requiresConfirmation: false,
  },
  {
    intent: "share_content",
    patterns: [
      "شارك", "ارسل لـ", "مشاركة", "share",
    ],
    requiresConfirmation: false,
  },
  {
    intent: "check_files",
    patterns: [
      "ملفاتي", "الملفات", "اعرض الملفات", "files",
      "مستنداتي",
    ],
    requiresConfirmation: false,
  },
];
