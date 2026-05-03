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
      "افتح الكاميرا", "كاميرا", "خذ صورة", "تصوير", "التقط صورة",
      "سيلفي", "فوتو", "photo", "camera", "صوّرني", "صورة سيلفي",
    ],
    requiresConfirmation: false,
  },
  {
    intent: "take_photo",
    patterns: [
      "التقط صورة", "فوتو", "سيلفي",
    ],
    requiresConfirmation: false,
  },
  {
    intent: "make_call",
    patterns: [
      "اتصل بـ", "اتصل ب", "كلم", "رن على", "تليفون",
      "اتصال بـ", "اتصال ب", "call", "اتصل فيه", "اتصل بي",
      "اتصل على", "اتصال على",
    ],
    requiresConfirmation: true,
  },
  {
    intent: "send_message",
    patterns: [
      "ارسل رسالة لـ", "ارسل رسالة ل", "ارسل رسالة إلى",
      "ارسل واتساب لـ", "ارسل واتساب ل", "ارسل واتساب إلى",
      "ابعث رسالة لـ", "ابعث رسالة ل", "ابعث واتساب لـ",
      "راسل", "مسج لـ", "مسج ل", "send message",
    ],
    requiresConfirmation: true,
  },
  {
    intent: "open_maps",
    patterns: [
      "افتح الخرائط", "خرائط جوجل", "دلني على", "روت", "مسار",
      "طريق إلى", "كيف أصل", "اوصل إلى", "خريطة", "maps",
      "وين يقع", "أين يقع", "ابحث في الخريطة",
    ],
    requiresConfirmation: false,
  },
  {
    intent: "set_reminder",
    patterns: [
      "ذكرني", "تذكير", "نبهني", "ضع تنبيه",
      "ذكرني بعد", "نبهني بعد", "تذكير بعد", "ذكّرني",
      "set reminder", "remind me", "ذكرني أن",
    ],
    requiresConfirmation: false,
  },
  {
    intent: "set_alarm",
    patterns: [
      "منبه الساعة", "أيقظني", "نبهني الساعة", "ضع منبه",
      "اجعل المنبه على",
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
      "افتح تطبيق", "شغل تطبيق", "افتح يوتيوب", "افتح واتساب",
      "افتح انستقرام", "افتح تيليجرام", "افتح سناب", "افتح تيك توك",
      "افتح فيسبوك", "افتح تويتر", "افتح نتفليكس", "افتح سبوتيفاي",
      "شغل", "دشغل", "open", "launch", "تشغيل",
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
      "مكاني", "موقعي الحالي", "عنواني", "GPS",
    ],
    requiresConfirmation: false,
  },
  {
    intent: "search_web",
    patterns: [
      "ابحث في الانترنت عن", "ابحث في الإنترنت عن", "جوجل",
      "بحث في جوجل", "سيرش عن", "ابحث عن", "دور في الانترنت عن",
      "بحث عن",
    ],
    requiresConfirmation: false,
  },
  {
    intent: "open_browser",
    patterns: [
      "افتح المتصفح", "افتح موقع", "تصفح", "متصفح",
      "افتح الإنترنت", "browser", "افتح موقع",
    ],
    requiresConfirmation: false,
  },
  {
    intent: "create_note",
    patterns: [
      "اكتب ملاحظة", "سجل ملاحظة", "دون ملاحظة", "ملاحظة جديدة",
      "note", "اكتب لي",
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
      "موعد في التقويم", "أضف إلى التقويم", "calendar",
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
      "شارك هذا", "مشاركة", "share",
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
