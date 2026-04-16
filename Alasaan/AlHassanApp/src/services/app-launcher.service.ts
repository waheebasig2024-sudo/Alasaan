import { Linking, Platform } from "react-native";
import { logger } from "../utils/logger";
import type { AppAlias } from "../memory/aliases-memory";

// Android-specific URL schemes for common apps
const URL_SCHEMES: Record<string, string> = {
  "com.whatsapp": "whatsapp://",
  "org.telegram.messenger": "tg://",
  "com.google.android.youtube": "vnd.youtube://",
  "com.google.android.apps.maps": "geo://",
  "com.android.chrome": "http://",
  "com.instagram.android": "instagram://",
  "com.twitter.android": "twitter://",
  "com.facebook.katana": "fb://",
  "com.snapchat.android": "snapchat://",
  "com.netflix.mediaclient": "nflx://",
  "com.google.android.gm": "mailto://",
  "com.spotify.music": "spotify://",
};

export async function openApp(app: AppAlias): Promise<boolean> {
  if (Platform.OS === "web") {
    logger.warn("app-launcher", "Cannot open native apps on web");
    return false;
  }

  const scheme = app.packageName ? URL_SCHEMES[app.packageName] : null;

  if (scheme) {
    try {
      const canOpen = await Linking.canOpenURL(scheme);
      if (canOpen) {
        await Linking.openURL(scheme);
        return true;
      }
    } catch {
      // Fall through to market
    }
  }

  // Fallback: open in Play Store
  if (app.packageName) {
    try {
      const marketUrl = `market://details?id=${app.packageName}`;
      const canOpen = await Linking.canOpenURL(marketUrl);
      if (canOpen) {
        await Linking.openURL(marketUrl);
        return true;
      }
    } catch {
      // Fall through
    }
  }

  logger.warn("app-launcher", `Could not open ${app.canonical}`);
  return false;
}

export async function openUrl(url: string): Promise<boolean> {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function makePhoneCall(phoneNumber: string): Promise<boolean> {
  const url = `tel:${phoneNumber.replace(/\s/g, "")}`;
  return openUrl(url);
}

export async function openMaps(
  query?: string,
  lat?: number,
  lng?: number
): Promise<boolean> {
  let url: string;
  if (lat !== undefined && lng !== undefined) {
    url = `geo:${lat},${lng}?q=${lat},${lng}`;
  } else if (query) {
    url = `geo:0,0?q=${encodeURIComponent(query)}`;
  } else {
    url = "geo:0,0";
  }
  return openUrl(url);
}

export async function openBrowser(url: string): Promise<boolean> {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }
  return openUrl(url);
}

export async function sendWhatsApp(phone: string, message?: string): Promise<boolean> {
  const encoded = message ? encodeURIComponent(message) : "";
  const url = `whatsapp://send?phone=${phone}&text=${encoded}`;
  return openUrl(url);
}
