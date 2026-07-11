import * as ImagePicker from "expo-image-picker";
import { api } from "./api";

export async function pickAndUploadImage(
  folder: "avatars" | "vehicles",
): Promise<string | null> {
  // request permission
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    throw new Error("Permission to access photos is required.");
  }

  // pick image
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  const asset = result.assets[0];
  const fileExtension = asset.uri.split(".").pop() ?? "jpg";
  const contentType = `image/${fileExtension === "jpg" ? "jpeg" : fileExtension}`;

  // get presigned upload URL from API
  const urlRes = await api.get("/api/v1/users/me/upload-url", {
    params: { folder, fileExtension, contentType },
  });
  const { uploadUrl, fileUrl } = urlRes.data.data;

  // fetch the image as blob
  const imageResponse = await fetch(asset.uri);
  const blob = await imageResponse.blob();

  // upload directly to S3
  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    body: blob,
    headers: {
      "Content-Type": contentType,
    },
  });

  if (!uploadResponse.ok) {
    throw new Error("Failed to upload image to S3.");
  }

  return fileUrl;
}
