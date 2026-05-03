import { Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as Contacts from "expo-contacts";
import * as Notifications from "expo-notifications";
import * as Calendar from "expo-calendar";
import * as LocalAuthentication from "expo-local-authentication";
import * as MediaLibrary from "expo-media-library";
import { Audio } from "expo-av";
import type { PermissionType } from "../constants/permissions";
import { logger } from "../utils/logger";

type PermissionStatus = "granted" | "denied" | "undetermined";

export async function checkPermission(permission: PermissionType): Promise<PermissionStatus> {
  if (Platform.OS === "web") return "denied";

  try {
    switch (permission) {
      case "camera": {
        const { status } = await ImagePicker.getCameraPermissionsAsync();
        return status as PermissionStatus;
      }
      case "microphone": {
        const { status } = await Audio.getPermissionsAsync();
        return status as PermissionStatus;
      }
      case "location": {
        const { status } = await Location.getForegroundPermissionsAsync();
        return status as PermissionStatus;
      }
      case "contacts": {
        const { status } = await Contacts.getPermissionsAsync();
        return status as PermissionStatus;
      }
      case "notifications": {
        const { status } = await Notifications.getPermissionsAsync();
        return status as PermissionStatus;
      }
      case "calendar": {
        const { status } = await Calendar.getCalendarPermissionsAsync();
        return status as PermissionStatus;
      }
      case "mediaLibrary": {
        const { status } = await MediaLibrary.getPermissionsAsync();
        return status as PermissionStatus;
      }
      default:
        return "undetermined";
    }
  } catch (error) {
    logger.error("permissions", `Check failed for ${permission}`, error);
    return "denied";
  }
}

export async function requestPermission(permission: PermissionType): Promise<boolean> {
  if (Platform.OS === "web") return false;

  try {
    switch (permission) {
      case "camera": {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        return status === "granted";
      }
      case "microphone": {
        const { status } = await Audio.requestPermissionsAsync();
        return status === "granted";
      }
      case "location": {
        const { status } = await Location.requestForegroundPermissionsAsync();
        return status === "granted";
      }
      case "contacts": {
        const { status } = await Contacts.requestPermissionsAsync();
        return status === "granted";
      }
      case "notifications": {
        const { status } = await Notifications.requestPermissionsAsync();
        return status === "granted";
      }
      case "calendar": {
        const { status } = await Calendar.requestCalendarPermissionsAsync();
        return status === "granted";
      }
      case "mediaLibrary": {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        return status === "granted";
      }
      default:
        return false;
    }
  } catch (error) {
    logger.error("permissions", `Request failed for ${permission}`, error);
    return false;
  }
}

export async function isPermissionGranted(permission: PermissionType): Promise<boolean> {
  const status = await checkPermission(permission);
  return status === "granted";
}
