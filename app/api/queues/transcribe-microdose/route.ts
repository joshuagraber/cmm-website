import { handleCallback } from "@vercel/queue";
import { processTranscriptionJob } from "@/lib/transcription/process-job";
import type { TranscriptionQueueMessage } from "@/lib/transcription/queue";

export const runtime = "nodejs";
export const maxDuration = 300;

export const POST = handleCallback<TranscriptionQueueMessage>(
  async (message, metadata) => {
    const jobId = typeof message.jobId === "string" ? message.jobId : "";

    if (!jobId) {
      throw new Error("jobId is required.");
    }

    try {
      await processTranscriptionJob(jobId);
    } catch (error) {
      if (metadata.deliveryCount >= 3) {
        return;
      }

      throw error;
    }
  },
  {
    visibilityTimeoutSeconds: 900,
  },
);
