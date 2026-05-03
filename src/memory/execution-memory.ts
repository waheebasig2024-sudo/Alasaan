import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../constants/storage-keys";
import type { ToolResult } from "../types/tool.types";
import { now } from "../utils/time";

export interface ExecutionRecord {
  id: string;
  toolName: string;
  input: string;
  result: ToolResult;
  timestamp: number;
}

const MAX_RECORDS = 100;

export async function recordExecution(
  toolName: string,
  input: string,
  result: ToolResult
): Promise<void> {
  const history = await getExecutionHistory();
  const record: ExecutionRecord = {
    id: Date.now().toString(),
    toolName,
    input,
    result,
    timestamp: now(),
  };
  history.push(record);
  const trimmed = history.slice(-MAX_RECORDS);
  await AsyncStorage.setItem(
    STORAGE_KEYS.EXECUTION_HISTORY,
    JSON.stringify(trimmed)
  );
}

export async function getExecutionHistory(): Promise<ExecutionRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.EXECUTION_HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function getSuccessfulPatterns(toolName: string): Promise<ExecutionRecord[]> {
  const history = await getExecutionHistory();
  return history.filter((r) => r.toolName === toolName && r.result.success);
}
