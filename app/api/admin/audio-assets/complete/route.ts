import {
  completeAudioAsset,
  getAudioAssetPlaybackUrl,
} from "@/lib/admin/microdose-repository";
import { jsonError, requireAdminApi } from "@/lib/admin/api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await requireAdminApi();

  if (!session) {
    return jsonError("Unauthorized", 401);
  }

  const body = await request.json();
  const audioAssetId =
    typeof body.audioAssetId === "string" ? body.audioAssetId : "";
  const durationSeconds =
    typeof body.durationSeconds === "number" &&
    Number.isFinite(body.durationSeconds)
      ? Math.round(body.durationSeconds)
      : undefined;

  if (!audioAssetId) {
    return jsonError("audioAssetId is required.");
  }

  await completeAudioAsset(audioAssetId, durationSeconds);
  const playbackUrl = await getAudioAssetPlaybackUrl(audioAssetId);

  return Response.json({ ok: true, playbackUrl });
}
