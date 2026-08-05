import { send } from "@vercel/queue";

export const transcriptionTopic = "microdose-transcription";

export type TranscriptionQueueMessage = {
  jobId: string;
};

export async function enqueueTranscriptionJob(jobId: string) {
  await send<TranscriptionQueueMessage>(
    transcriptionTopic,
    { jobId },
    { idempotencyKey: jobId, retentionSeconds: 86400 },
  );

  return { queued: true, reason: null };
}
