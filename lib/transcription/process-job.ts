import {
  getTranscriptionJobForProcessing,
  markTranscriptionJobComplete,
  markTranscriptionJobFailed,
  markTranscriptionJobRunning,
  replaceRevisionTranscript,
} from "@/lib/admin/microdose-repository";
import { transcribeS3Audio } from "@/lib/transcription/whisper-provider";

export async function processTranscriptionJob(jobId: string) {
  const job = await getTranscriptionJobForProcessing(jobId);

  if (!job) {
    throw new Error(`Transcription job ${jobId} was not found.`);
  }

  if (job.status === "complete") {
    return { skipped: true, segments: 0 };
  }

  try {
    await markTranscriptionJobRunning(jobId);
    const transcript = await transcribeS3Audio(job.s3Key);
    await replaceRevisionTranscript(job.revisionId, transcript);
    await markTranscriptionJobComplete(jobId);

    return { skipped: false, segments: transcript.length };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Transcription failed.";
    await markTranscriptionJobFailed(jobId, message);

    throw error;
  }
}
