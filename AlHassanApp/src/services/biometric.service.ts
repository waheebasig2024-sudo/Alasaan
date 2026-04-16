import * as LocalAuthentication from "expo-local-authentication";
import { Platform } from "react-native";
import { logger } from "../utils/logger";

export async function isBiometricAvailable(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return compatible && enrolled;
  } catch {
    return false;
  }
}

export async function authenticateWithBiometric(
  promptMessage = "التحقق من هويتك"
): Promise<boolean> {
  if (Platform.OS === "web") return true;
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: "إلغاء",
      fallbackLabel: "استخدم كلمة المرور",
    });
    return result.success;
  } catch (error) {
    logger.error("biometric", "Auth failed", error);
    return false;
  }
}
