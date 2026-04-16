import { ERROR_MESSAGES } from "../constants/error-messages";
import { logger } from "../utils/logger";

export interface FallbackResult {
  message: string;
  shouldAskUser: boolean;
}

export function handleToolFailure(
  toolName: string,
  errorMessage: string
): FallbackResult {
  logger.warn("fallback", `Tool failure: ${toolName} - ${errorMessage}`);
  return {
    message: `لم أتمكن من تنفيذ "${toolName}". ${errorMessage}`,
    shouldAskUser: false,
  };
}

export function handleGeminiFailure(error?: string): FallbackResult {
  logger.warn("fallback", `Gemini failure: ${error}`);

  if (error?.includes("اتصال") || error?.includes("إنترنت")) {
    return {
      message: ERROR_MESSAGES.NETWORK_ERROR,
      shouldAskUser: false,
    };
  }

  return {
    message: ERROR_MESSAGES.GEMINI_UNAVAILABLE,
    shouldAskUser: false,
  };
}

export function handleUnknownInput(): FallbackResult {
  return {
    message: ERROR_MESSAGES.UNKNOWN_COMMAND,
    shouldAskUser: true,
  };
}

export function noHallucinationResponse(): string {
  return ERROR_MESSAGES.NO_HALLUCINATION;
}
