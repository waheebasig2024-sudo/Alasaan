import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import { logger } from "../utils/logger";

export async function getDocumentsDirectory(): Promise<string | null> {
  if (Platform.OS === "web") return null;
  return FileSystem.documentDirectory;
}

export async function readFile(uri: string): Promise<string | null> {
  if (Platform.OS === "web") return null;
  try {
    return await FileSystem.readAsStringAsync(uri);
  } catch {
    return null;
  }
}

export async function writeFile(filename: string, content: string): Promise<string | null> {
  if (Platform.OS === "web") return null;
  try {
    const uri = `${FileSystem.documentDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(uri, content);
    return uri;
  } catch (error) {
    logger.error("files", "Write failed", error);
    return null;
  }
}

export async function shareFile(uri: string): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    const available = await Sharing.isAvailableAsync();
    if (!available) return false;
    await Sharing.shareAsync(uri);
    return true;
  } catch {
    return false;
  }
}

export async function listFiles(): Promise<string[]> {
  if (Platform.OS === "web") return [];
  try {
    const dir = FileSystem.documentDirectory;
    if (!dir) return [];
    return await FileSystem.readDirectoryAsync(dir);
  } catch {
    return [];
  }
}
