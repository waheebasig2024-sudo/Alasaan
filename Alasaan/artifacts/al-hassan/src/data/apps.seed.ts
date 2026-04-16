import type { AppAlias } from "../memory/aliases-memory";

export const APPS_SEED: AppAlias[] = [
  {
    canonical: "واتساب",
    packageName: "com.whatsapp",
    aliases: ["whatsapp", "واتس", "WhatsApp", "وتساب"],
    category: "social",
  },
  {
    canonical: "تيليجرام",
    packageName: "org.telegram.messenger",
    aliases: ["telegram", "تيليغرام", "تيلقرام"],
    category: "social",
  },
  {
    canonical: "يوتيوب",
    packageName: "com.google.android.youtube",
    aliases: ["youtube", "يوتيوب", "يونيوب", "YouTube"],
    category: "media",
  },
  {
    canonical: "كاميرا",
    packageName: "android.media.action.STILL_IMAGE_CAMERA",
    aliases: ["camera", "الكاميرا", "صور", "تصوير"],
    category: "system",
  },
  {
    canonical: "خرائط جوجل",
    packageName: "com.google.android.apps.maps",
    aliases: ["google maps", "خرائط", "maps", "جوجل ماب"],
    category: "navigation",
  },
  {
    canonical: "كروم",
    packageName: "com.android.chrome",
    aliases: ["chrome", "google chrome", "المتصفح", "متصفح"],
    category: "browser",
  },
  {
    canonical: "إعدادات",
    packageName: "android.settings.SETTINGS",
    aliases: ["settings", "الإعدادات", "ضبط"],
    category: "system",
  },
  {
    canonical: "انستقرام",
    packageName: "com.instagram.android",
    aliases: ["instagram", "انستجرام", "إنستقرام"],
    category: "social",
  },
  {
    canonical: "تويتر",
    packageName: "com.twitter.android",
    aliases: ["twitter", "x", "تويتر", "إكس"],
    category: "social",
  },
  {
    canonical: "فيسبوك",
    packageName: "com.facebook.katana",
    aliases: ["facebook", "فيس", "فيسبوك"],
    category: "social",
  },
  {
    canonical: "سناب شات",
    packageName: "com.snapchat.android",
    aliases: ["snapchat", "سناب", "snap"],
    category: "social",
  },
  {
    canonical: "نتفليكس",
    packageName: "com.netflix.mediaclient",
    aliases: ["netflix", "نتفلكس"],
    category: "media",
  },
  {
    canonical: "أمازون",
    packageName: "com.amazon.mShop.android.shopping",
    aliases: ["amazon", "امازون", "Amazon"],
    category: "shopping",
  },
  {
    canonical: "جيميل",
    packageName: "com.google.android.gm",
    aliases: ["gmail", "البريد", "بريد", "email", "ايميل"],
    category: "productivity",
  },
  {
    canonical: "موسيقى سبوتيفاي",
    packageName: "com.spotify.music",
    aliases: ["spotify", "سبوتيفاي", "موسيقى", "music"],
    category: "media",
  },
];
