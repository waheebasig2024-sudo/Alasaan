import { useState, useCallback } from "react";
import { requestPermission } from "../services/permissions.service";
import type { PermissionType } from "../constants/permissions";

export function useToolPermissions() {
  const [requested, setRequested] = useState<Set<PermissionType>>(new Set());

  const ensurePermission = useCallback(
    async (permission: PermissionType): Promise<boolean> => {
      const granted = await requestPermission(permission);
      setRequested((prev) => new Set([...prev, permission]));
      return granted;
    },
    []
  );

  return { ensurePermission, requested };
}
