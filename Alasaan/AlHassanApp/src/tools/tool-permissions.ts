import { isPermissionGranted, requestPermission } from "../services/permissions.service";
import type { PermissionType } from "../constants/permissions";

export async function ensurePermission(permission: PermissionType): Promise<boolean> {
  const granted = await isPermissionGranted(permission);
  if (granted) return true;
  return requestPermission(permission);
}

export async function checkMultiplePermissions(
  permissions: PermissionType[]
): Promise<Record<PermissionType, boolean>> {
  const results: Partial<Record<PermissionType, boolean>> = {};
  await Promise.all(
    permissions.map(async (p) => {
      results[p] = await isPermissionGranted(p);
    })
  );
  return results as Record<PermissionType, boolean>;
}
