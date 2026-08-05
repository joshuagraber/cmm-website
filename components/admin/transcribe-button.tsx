"use client";

import { useRouter } from "next/navigation";
import { AudioLines } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export function TranscribeButton({ slug }: { slug: string }) {
  const router = useRouter();
  const refreshTimersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    return () => {
      refreshTimersRef.current.forEach((timer) => clearTimeout(timer));
      refreshTimersRef.current = [];
    };
  }, []);

  function clearRefreshTimers() {
    refreshTimersRef.current.forEach((timer) => clearTimeout(timer));
    refreshTimersRef.current = [];
  }

  function pollForTranscript() {
    clearRefreshTimers();
    refreshTimersRef.current = Array.from({ length: 15 }, (_, index) =>
      setTimeout(() => {
        router.refresh();
      }, (index + 1) * 4000),
    );
  }

  async function transcribe() {
    setPending(true);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/microdoses/${slug}/transcribe`, {
        method: "POST",
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error ?? "Transcription failed to queue.");
      }

      setMessage(body.message ?? `Job ${body.jobId} created.`);
      router.refresh();
      if (body.queued) {
        pollForTranscript();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Transcription failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-2">
      <Button type="button" onClick={transcribe} disabled={pending}>
        <AudioLines aria-hidden="true" className="mr-2 size-4" />
        {pending ? "Queueing" : "Transcribe"}
      </Button>
      {message ? <p className="max-w-md text-sm font-bold">{message}</p> : null}
    </div>
  );
}
