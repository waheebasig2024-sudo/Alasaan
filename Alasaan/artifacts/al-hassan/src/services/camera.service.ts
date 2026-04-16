import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";
import { logger } from "../utils/logger";
import { requestPermission } from "./permissions.service";

export interface CapturedMedia {
  uri: string;
  type: "photo" | "video";
  width?: number;
  height?: number;
}

export async function openCamera(mediaType: "photo" | "video" = "photo"): Promise<CapturedMedia | null> {
  const granted = await requestPermission("camera");
  if (!granted) return null;

  try {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: mediaType === "photo"
        ? ImagePicker.MediaTypeOptions.Images
        : ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 0.9,
    });

    if (result.canceled || !result.assets[0]) return null;

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      type: mediaType,
      width: asset.width,
      height: asset.height,
    };
  } catch (error) {
    logger.error("camera", "Launch failed", error);
    return null;
  }
}

export async function openGallery(): Promise<CapturedMedia | null> {
  const granted = await requestPermission("mediaLibrary");
  if (!granted) return null;

  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 0.9,
    });

    if (result.canceled || !result.assets[0]) return null;
    const asset = result.assets[0];
    return {
      uri: asset.uri,
      type: asset.type === "video" ? "video" : "photo",
      width: asset.width,
      height: asset.height,
    };
  } catch (error) {
    logger.error("camera", "Gallery open failed", error);
    return null;
  }
}
