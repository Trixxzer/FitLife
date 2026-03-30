import { Alert, Linking } from "react-native";
import { supabase } from "./supabase";

export const TRAINER_UPLOADS_BUCKET = "trainer_uploads";

export const resolveStoragePath = (
  filePath?: string | null,
  userId?: string | null,
) => {
  if (!filePath) return null;

  const cleanPath = String(filePath).trim();
  if (!cleanPath) return null;

  // already includes folder path
  if (cleanPath.includes("/")) return cleanPath;

  // rebuild path if only filename is stored
  if (userId) {
    const cleanUserId = String(userId).trim();
    if (cleanUserId) {
      return `${cleanUserId}/${cleanPath}`;
    }
  }

  return cleanPath;
};

export const getStorageFileUrl = async (
  bucket: string,
  filePath?: string | null,
  userId?: string | null,
) => {
  try {
    const resolvedPath = resolveStoragePath(filePath, userId);
    if (!resolvedPath) return null;

    // for private bucket use signed URL
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(resolvedPath, 60 * 5);

    if (error) {
      console.error("createSignedUrl error:", error);
      return null;
    }

    return data?.signedUrl ?? null;
  } catch (error) {
    console.error("getStorageFileUrl error:", error);
    return null;
  }
};

export const openStorageFile = async (
  bucket: string,
  filePath?: string | null,
  userId?: string | null,
) => {
  try {
    if (!filePath) {
      Alert.alert("File not found", "No file path was saved.");
      return;
    }

    const url = await getStorageFileUrl(bucket, filePath, userId);

    if (!url) {
      Alert.alert("Open failed", "Could not generate file URL.");
      return;
    }

    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert("Open failed", "This file cannot be opened on your device.");
      return;
    }

    await Linking.openURL(url);
  } catch (error) {
    console.error("openStorageFile error:", error);
    Alert.alert("Open failed", "Object not found or storage access failed.");
  }
};
