import { create } from "zustand";
import { DEFAULT_SETTINGS } from "../constants/defaults";
import type { AppSettings } from "../types/settings.types";
import { storageGet, storageSet } from "../services/storage.service";
import { STORAGE_KEYS } from "../constants/storage-keys";
import { setSafeMode } from "../security/safe-mode";

interface SettingsStore {
  settings: AppSettings;
  isLoaded: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoaded: false,

  loadSettings: async () => {
    const stored = await storageGet<AppSettings>(STORAGE_KEYS.SETTINGS);
    const settings = stored ? { ...DEFAULT_SETTINGS, ...stored } : DEFAULT_SETTINGS;
    setSafeMode(settings.safeMode);
    set({ settings, isLoaded: true });
  },

  updateSettings: async (updates) => {
    const settings = { ...get().settings, ...updates };
    setSafeMode(settings.safeMode);
    set({ settings });
    await storageSet(STORAGE_KEYS.SETTINGS, settings);
  },

  resetSettings: async () => {
    set({ settings: DEFAULT_SETTINGS });
    await storageSet(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  },
}));
