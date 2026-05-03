import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../constants/storage-keys";
import { normalizeArabic } from "../utils/text";
import { APPS_SEED } from "../data/apps.seed";

export interface AppAlias {
  canonical: string;
  packageName?: string;
  aliases: string[];
  category: string;
}

let _aliases: AppAlias[] | null = null;

async function load(): Promise<AppAlias[]> {
  if (_aliases) return _aliases;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.APP_ALIASES);
    const stored: AppAlias[] = raw ? JSON.parse(raw) : [];
    // Merge with seed data
    const merged = [...APPS_SEED];
    for (const alias of stored) {
      const idx = merged.findIndex((a) => a.canonical === alias.canonical);
      if (idx >= 0) {
        merged[idx].aliases = [...new Set([...merged[idx].aliases, ...alias.aliases])];
      } else {
        merged.push(alias);
      }
    }
    _aliases = merged;
    return _aliases;
  } catch {
    _aliases = [...APPS_SEED];
    return _aliases;
  }
}

export async function resolveAppName(input: string): Promise<AppAlias | null> {
  const aliases = await load();
  const normalized = normalizeArabic(input);

  for (const app of aliases) {
    if (normalizeArabic(app.canonical) === normalized) return app;
    for (const alias of app.aliases) {
      if (normalizeArabic(alias) === normalized) return app;
    }
  }
  return null;
}

export async function addAlias(
  canonical: string,
  newAlias: string,
  packageName?: string
): Promise<void> {
  const aliases = await load();
  const idx = aliases.findIndex((a) => a.canonical === canonical);
  if (idx >= 0) {
    if (!aliases[idx].aliases.includes(newAlias)) {
      aliases[idx].aliases.push(newAlias);
    }
  } else {
    aliases.push({ canonical, packageName, aliases: [newAlias], category: "custom" });
  }
  _aliases = aliases;
  const custom = aliases.filter((a) => a.category === "custom");
  await AsyncStorage.setItem(STORAGE_KEYS.APP_ALIASES, JSON.stringify(custom));
}

export async function getAllAliases(): Promise<AppAlias[]> {
  return load();
}
