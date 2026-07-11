import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from "../config/index.js";
import { randomUUID } from "crypto";

const s3Client = new S3Client({
  region: config.AWS_REGION,
  credentials: {
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
  },
});

export async function getPresignedUploadUrl(
  folder: "avatars" | "vehicles",
  fileExtension: string,
  contentType: string,
): Promise<{ uploadUrl: string; fileUrl: string; key: string }> {
  const key = `${folder}/${randomUUID()}.${fileExtension}`;

  const command = new PutObjectCommand({
    Bucket: config.AWS_S3_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // 5 min

  const fileUrl = `https://${config.AWS_S3_BUCKET_NAME}.s3.${config.AWS_REGION}.amazonaws.com/${key}`;

  return { uploadUrl, fileUrl, key };
}
