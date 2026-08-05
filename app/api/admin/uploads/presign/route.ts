import { createAudioAsset } from "@/lib/admin/microdose-repository";
import { jsonError, requireAdminApi } from "@/lib/admin/api";
import { createAudioUploadUrl } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await requireAdminApi();

  if (!session) {
    return jsonError("Unauthorized", 401);
  }

  const body = await request.json();
  const filename = typeof body.filename === "string" ? body.filename : "";
  const contentType =
    typeof body.contentType === "string" ? body.contentType : "audio/mpeg";
  const sizeBytes =
    typeof body.sizeBytes === "number" && Number.isFinite(body.sizeBytes)
      ? body.sizeBytes
      : undefined;

  if (!filename || !contentType.startsWith("audio/")) {
    return jsonError("Audio filename and content type are required.");
  }

  const safeFilename = filename.replace(/[^A-Za-z0-9._-]/g, "-");
  const s3Key = `audio/microdoses/${crypto.randomUUID()}-${safeFilename}`;
  const asset = await createAudioAsset({
    s3Key,
    originalFilename: filename,
    mimeType: contentType,
    sizeBytes,
  });
  const uploadUrl = await createAudioUploadUrl({ key: s3Key, contentType });

  return Response.json({
    audioAssetId: asset.id,
    s3Key,
    uploadUrl,
  });
}
