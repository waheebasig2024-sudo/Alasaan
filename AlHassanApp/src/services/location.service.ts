import * as Location from "expo-location";
import { Platform } from "react-native";
import { logger } from "../utils/logger";
import { requestPermission } from "./permissions.service";

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  address?: string;
}

export async function getCurrentLocation(): Promise<LocationData | null> {
  if (Platform.OS === "web") {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          }),
        () => resolve(null)
      );
    });
  }

  const granted = await requestPermission("location");
  if (!granted) return null;

  try {
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      accuracy: loc.coords.accuracy,
    };
  } catch (error) {
    logger.error("location", "Failed to get location", error);
    return null;
  }
}

export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<string | null> {
  if (Platform.OS === "web") return null;
  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (results.length > 0) {
      const r = results[0];
      return [r.street, r.city, r.country].filter(Boolean).join(", ");
    }
    return null;
  } catch {
    return null;
  }
}
