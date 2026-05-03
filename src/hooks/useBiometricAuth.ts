import { useState, useEffect } from "react";
import { isBiometricAvailable, authenticateWithBiometric } from "../services/biometric.service";

export function useBiometricAuth() {
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    isBiometricAvailable().then(setIsAvailable);
  }, []);

  const authenticate = async (prompt?: string): Promise<boolean> => {
    if (!isAvailable) return true;
    return authenticateWithBiometric(prompt);
  };

  return { isAvailable, authenticate };
}
