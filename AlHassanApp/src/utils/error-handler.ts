import type { AppError } from "../types/common.types";
import { logger } from "./logger";

export function toAppError(error: unknown, code = "UNKNOWN_ERROR"): AppError {
  if (error instanceof Error) {
    return { code, message: error.message, details: error };
  }
  if (typeof error === "string") {
    return { code, message: error };
  }
  return { code, message: "حدث خطأ غير متوقع", details: error };
}

export function handleError(tag: string, error: unknown): AppError {
  const appError = toAppError(error);
  logger.error(tag, appError.message, appError.details);
  return appError;
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && error.message.includes("Network")) return true;
  if (error instanceof Error && error.message.includes("fetch")) return true;
  return false;
}
