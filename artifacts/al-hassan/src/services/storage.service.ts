import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Result } from "../types/common.types";

export async function storageGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function storageSet<T>(key: string, value: T): Promise<Result<void>> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function storageRemove(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

export async function storageClear(): Promise<void> {
  await AsyncStorage.clear();
}

export async function storageGetAllKeys(): Promise<readonly string[]> {
  return AsyncStorage.getAllKeys();
}
