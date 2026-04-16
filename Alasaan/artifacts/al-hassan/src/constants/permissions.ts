export const PERMISSIONS = {
  CAMERA: "camera",
  MICROPHONE: "microphone",
  CONTACTS: "contacts",
  LOCATION: "location",
  NOTIFICATIONS: "notifications",
  CALENDAR: "calendar",
  MEDIA_LIBRARY: "mediaLibrary",
  STORAGE: "storage",
} as const;

export type PermissionType = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERMISSION_LABELS: Record<PermissionType, string> = {
  camera: "الكاميرا",
  microphone: "الميكروفون",
  contacts: "جهات الاتصال",
  location: "الموقع الجغرافي",
  notifications: "الإشعارات",
  calendar: "التقويم",
  mediaLibrary: "مكتبة الوسائط",
  storage: "التخزين",
};

export const PERMISSION_DESCRIPTIONS: Record<PermissionType, string> = {
  camera: "للتقاط الصور وتسجيل الفيديو",
  microphone: "للإدخال الصوتي والتسجيل",
  contacts: "للبحث في جهات الاتصال والاتصال بها",
  location: "للحصول على موقعك وفتح الخرائط",
  notifications: "لإرسال التذكيرات والتنبيهات",
  calendar: "لإضافة المواعيد وقراءتها",
  mediaLibrary: "للوصول إلى الصور والفيديوهات",
  storage: "لقراءة وحفظ الملفات",
};
