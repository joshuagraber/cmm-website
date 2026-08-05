import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let cachedS3Client: S3Client | null = null;

export function getS3Bucket() {
  const bucket = process.env.AWS_S3_BUCKET;

  if (!bucket) {
    throw new Error("AWS_S3_BUCKET is required for S3 operations.");
  }

  return bucket;
}

export function getS3Client() {
  if (!cachedS3Client) {
    cachedS3Client = new S3Client({
      region: process.env.AWS_REGION ?? "us-east-2",
      requestChecksumCalculation: "WHEN_REQUIRED",
    });
  }

  return cachedS3Client;
}

export async function createAudioUploadUrl(input: {
  key: string;
  contentType: string;
}) {
  const command = new PutObjectCommand({
    Bucket: getS3Bucket(),
    Key: input.key,
    ContentType: input.contentType,
  });

  return getSignedUrl(getS3Client(), command, {
    expiresIn: 900,
    signableHeaders: new Set(["content-type"]),
  });
}

export async function createAudioPlaybackUrl(key: string) {
  const command = new GetObjectCommand({
    Bucket: getS3Bucket(),
    Key: key,
  });

  return getSignedUrl(getS3Client(), command, { expiresIn: 3600 });
}

export async function downloadAudioObject(key: string) {
  const response = await getS3Client().send(
    new GetObjectCommand({
      Bucket: getS3Bucket(),
      Key: key,
    }),
  );

  if (!response.Body) {
    throw new Error(`S3 object "${key}" had no body.`);
  }

  return Buffer.from(await response.Body.transformToByteArray());
}
