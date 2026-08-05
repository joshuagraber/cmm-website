import { createTranscriptionJob } from "@/lib/admin/microdose-repository";
import { jsonError, requireAdminApi } from "@/lib/admin/api";
import { processTranscriptionJob } from "@/lib/transcription/process-job";
import { enqueueTranscriptionJob } from "@/lib/transcription/queue";

export const runtime = "nodejs";

type TranscribeRouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function POST(_request: Request, context: TranscribeRouteContext) {
  const session = await requireAdminApi();

  if (!session) {
    return jsonError("Unauthorized", 401);
  }

  const { slug } = await context.params;
  const job = await createTranscriptionJob(slug);

  if (process.env.TRANSCRIPTION_QUEUE_MODE === "inline") {
    const result = await processTranscriptionJob(job.id);

    return Response.json({
      jobId: job.id,
      queued: false,
      processed: true,
      message: result.skipped
        ? "Transcription was already complete."
        : `Transcribed ${result.segments} segments locally.`,
    });
  }

  const queue = await enqueueTranscriptionJob(job.id);

  return Response.json({
    jobId: job.id,
    queued: queue.queued,
    message: queue.queued ? "Queued for transcription." : queue.reason,
  });
}
