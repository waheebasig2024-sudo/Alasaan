export const ERROR_MESSAGES = {
  PERMISSION_DENIED: "لا توجد صلاحية للقيام بهذا الإجراء.",
  TOOL_NOT_AVAILABLE: "هذه الأداة غير متاحة على هذا الجهاز.",
  GEMINI_UNAVAILABLE: "لا يمكن الوصول إلى خدمة الذكاء الاصطناعي حالياً.",
  NETWORK_ERROR: "لا يوجد اتصال بالإنترنت.",
  UNKNOWN_COMMAND: "لم أفهم طلبك. هل يمكنك توضيح ما تريد؟",
  CONTACT_NOT_FOUND: "لم أجد جهة الاتصال المطلوبة.",
  APP_NOT_FOUND: "لم أجد التطبيق المطلوب.",
  ACTION_CANCELLED: "تم إلغاء الإجراء.",
  MEMORY_EMPTY: "لا توجد معلومات محفوظة بعد.",
  GEMINI_API_KEY_MISSING: "مفتاح Gemini API غير مهيأ. يرجى إضافته في الإعدادات.",
  TOOL_EXECUTION_FAILED: "فشل تنفيذ الأمر.",
  NO_HALLUCINATION: "لا أملك معلومات كافية للرد على هذا السؤال بشكل موثوق.",
} as const;
