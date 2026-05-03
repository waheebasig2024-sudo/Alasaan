import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { Platform } from "react-native";
import { Audio } from "expo-av";
import { checkPermission, requestPermission } from "../services/permissions.service";
import type { PermissionType } from "../constants/permissions";

interface PermissionsContextValue {
  permissionsStatus: Record<string, string>;
  checkAndRequest: (permission: PermissionType) => Promise<boolean>;
  refreshPermissions: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

const IMPORTANT_PERMISSIONS: PermissionType[] = [
  "camera",
  "contacts",
  "location",
  "notifications",
];

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const [permissionsStatus, setPermissionsStatus] = useState<Record<string, string>>({});

  const refreshPermissions = useCallback(async () => {
    const results: Record<string, string> = {};
    await Promise.all(
      IMPORTANT_PERMISSIONS.map(async (p) => {
        results[p] = await checkPermission(p);
      })
    );
    setPermissionsStatus(results);
  }, []);

  const checkAndRequest = useCallback(async (permission: PermissionType): Promise<boolean> => {
    const granted = await requestPermission(permission);
    setPermissionsStatus((prev) => ({
      ...prev,
      [permission]: granted ? "granted" : "denied",
    }));
    return granted;
  }, []);

  useEffect(() => {
    if (Platform.OS === "web") return;
    (async () => {
      try {
        await Audio.requestPermissionsAsync();
      } catch {}
    })();
  }, []);

  return (
    <PermissionsContext.Provider
      value={{ permissionsStatus, checkAndRequest, refreshPermissions }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissionsContext(): PermissionsContextValue {
  const ctx = useContext(PermissionsContext);
  if (!ctx) throw new Error("usePermissionsContext must be used within PermissionsProvider");
  return ctx;
}
