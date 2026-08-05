"use client";

import { useEffect, useState } from "react";
import { TranscribeButton } from "@/components/admin/transcribe-button";
import { Button } from "@/components/ui/button";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type MicrodoseActionsProps = {
  slug: string;
  isPublished: boolean;
  hasStagedChanges: boolean;
  publishAction: (formData: FormData) => void | Promise<void>;
  unpublishAction: (formData: FormData) => void | Promise<void>;
  archiveAction: (formData: FormData) => void | Promise<void>;
};

export function MicrodoseActions({
  slug,
  isPublished,
  hasStagedChanges,
  publishAction,
  unpublishAction,
  archiveAction,
}: MicrodoseActionsProps) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState("");
  const [hasLocalStagedChanges, setHasLocalStagedChanges] =
    useState(hasStagedChanges);
  const publishLabel = isPublished ? "Publish updates" : "Publish";
  const hasPublishableChanges = hasLocalStagedChanges || !isPublished;
  const publishDisabled =
    hasUnsavedChanges ||
    saveStatus === "saving" ||
    saveStatus === "error" ||
    (isPublished && !hasPublishableChanges);
  const publishTitle = hasUnsavedChanges
    ? "Wait for autosave before publishing."
    : saveStatus === "saving"
      ? "Draft is still saving."
      : saveStatus === "error"
        ? "Fix the autosave error before publishing."
    : publishDisabled
      ? "There are no saved updates to publish."
      : undefined;

  useEffect(() => {
    function handleDirtyState(event: Event) {
      if (event instanceof CustomEvent) {
        setHasUnsavedChanges(Boolean(event.detail?.dirty));
        setSaveStatus((event.detail?.saveStatus as SaveStatus) ?? "idle");
        setSaveError(
          typeof event.detail?.error === "string" ? event.detail.error : "",
        );

        if (event.detail?.savedDraft && isPublished) {
          setHasLocalStagedChanges(true);
        }
      }
    }

    window.addEventListener("cmm:microdose-editor-dirty", handleDirtyState);

    return () => {
      window.removeEventListener("cmm:microdose-editor-dirty", handleDirtyState);
    };
  }, [isPublished]);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        {saveStatus === "saving" ? (
          <StateBadge label="Saving draft" tone="alert" />
        ) : saveStatus === "error" ? (
          <StateBadge label="Autosave failed" tone="alert" />
        ) : hasUnsavedChanges ? (
          <StateBadge label="Unsaved changes" tone="alert" />
        ) : saveStatus === "saved" ? (
          <StateBadge label="Draft saved" />
        ) : (
          <StateBadge label="No unsaved changes" />
        )}
        {hasUnsavedChanges || saveStatus === "saving" ? (
          <StateBadge label="Autosave pending" tone="alert" />
        ) : hasLocalStagedChanges ? (
          <StateBadge label="Unpublished changes" tone="alert" />
        ) : isPublished ? (
          <StateBadge label="Published version is current" />
        ) : (
          <StateBadge label="Not published" />
        )}
      </div>
      {saveError ? (
        <p className="max-w-2xl text-sm font-bold text-cmm-coral">
          {saveError}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <form action={publishAction}>
          <Button
            type="submit"
            disabled={publishDisabled}
            title={publishTitle}
          >
            {publishLabel}
          </Button>
        </form>
        <TranscribeButton slug={slug} />
        {isPublished ? (
          <form action={unpublishAction}>
            <Button type="submit">Unpublish</Button>
          </form>
        ) : null}
        <form action={archiveAction}>
          <Button type="submit" variant="ghost">
            Archive
          </Button>
        </form>
      </div>
    </div>
  );
}

function StateBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "alert";
}) {
  return (
    <span
      className={
        tone === "alert"
          ? "border-2 border-cmm-coral bg-cmm-coral px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-black"
          : "border-2 border-foreground px-3 py-2 text-xs font-black uppercase tracking-[0.12em]"
      }
    >
      {label}
    </span>
  );
}
