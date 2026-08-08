"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Plus, Scissors, Trash2, Upload } from "lucide-react";
import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { TranscribeButton } from "@/components/admin/transcribe-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { parseTags, serializeTags } from "@/lib/admin/forms";
import {
  microdoseIconNames,
  type MicrodoseIcon,
} from "@/lib/microdose-constants";
import {
  type TranscriptSegment,
} from "@/lib/microdoses";

type PersonOption = {
  id: string;
  name: string;
};

type AudioAssetOption = {
  id: string;
  originalFilename: string;
};

type TagOption = {
  value: string;
  label: string;
};

type EditorValue = {
  slug: string;
  title: string;
  description: string;
  speakerLabel: string;
  icon: MicrodoseIcon;
  audioAssetId: string | null;
  audioSrc: string | null;
  tags: Array<{ value: string; label: string }>;
  speakerIds: string[];
  subjectIds: string[];
  transcript: TranscriptSegment[];
};

type MicrodoseEditorProps = {
  value: EditorValue;
  people: PersonOption[];
  audioAssets: AudioAssetOption[];
  existingTags: TagOption[];
  submitLabel?: string;
  formId?: string;
  savedStateKey?: string;
  autosaveSlug?: string;
  draftStorageKey?: string;
  hideSubmitButton?: boolean;
  action: (formData: FormData) => void | Promise<void>;
};

export function MicrodoseEditor({
  value,
  people,
  audioAssets,
  existingTags,
  submitLabel = "Save draft",
  formId,
  savedStateKey,
  autosaveSlug,
  draftStorageKey,
  hideSubmitButton = false,
  action,
}: MicrodoseEditorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const formRef = useRef<HTMLFormElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const savedFormSnapshotRef = useRef("");
  const dirtyFrameRef = useRef<number | null>(null);
  const autosaveTimerRef = useRef<number | null>(null);
  const autosaveInFlightRef = useRef(false);
  const autosaveSlugRef = useRef(autosaveSlug);
  const beforeUnloadStateRef = useRef({
    dirty: false,
    saving: false,
    failed: false,
  });
  const [audioAssetId, setAudioAssetId] = useState(value.audioAssetId ?? "");
  const [audioSrc, setAudioSrc] = useState(value.audioSrc ?? "");
  const [uploadedAudioAssets, setUploadedAudioAssets] = useState<
    AudioAssetOption[]
  >([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [selectedTags, setSelectedTags] = useState(value.tags);
  const [newTagInput, setNewTagInput] = useState("");
  const [selectedSpeakerIds, setSelectedSpeakerIds] = useState(value.speakerIds);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState(value.subjectIds);
  const [segments, setSegments] = useState(value.transcript);
  const tagOptions = useMemo(() => {
    const seen = new Set<string>();

    return [...selectedTags, ...existingTags].filter((tag) => {
      const normalizedValue = tag.value.toLowerCase();

      if (seen.has(normalizedValue)) {
        return false;
      }

      seen.add(normalizedValue);
      return true;
    });
  }, [existingTags, selectedTags]);
  const tagsJson = useMemo(() => serializeTags(selectedTags), [selectedTags]);
  const transcriptJson = useMemo(() => JSON.stringify(segments), [segments]);
  const onlySelectedSpeakerId =
    selectedSpeakerIds.length === 1 ? selectedSpeakerIds[0] : undefined;
  const availableAudioAssets = useMemo(() => {
    const serverIds = new Set(audioAssets.map((asset) => asset.id));

    return [
      ...uploadedAudioAssets.filter((asset) => !serverIds.has(asset.id)),
      ...audioAssets,
    ];
  }, [audioAssets, uploadedAudioAssets]);

  useEffect(() => {
    autosaveSlugRef.current = autosaveSlug;
  }, [autosaveSlug]);

  useEffect(() => {
    savedFormSnapshotRef.current = getFormSnapshot(formRef.current);
    beforeUnloadStateRef.current = { dirty: false, saving: false, failed: false };
    dispatchEditorState({ dirty: false, saveStatus: "idle" });
  }, [savedStateKey]);

  useEffect(() => {
    if (!draftStorageKey) {
      return;
    }

    const storedDraft = window.sessionStorage.getItem(draftStorageKey);

    if (!storedDraft) {
      return;
    }

    try {
      restoreDraft(JSON.parse(storedDraft), formRef.current, {
        setAudioAssetId,
        setSelectedTags,
        setSelectedSpeakerIds,
        setSelectedSubjectIds,
        setSegments,
        setNewTagInput,
      });
      window.setTimeout(() => {
        savedFormSnapshotRef.current = getFormSnapshot(formRef.current);
        scheduleDirtyCheck();
      }, 0);
    } catch {
      window.sessionStorage.removeItem(draftStorageKey);
    }
    // Restore must run once for this editor instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftStorageKey]);

  useEffect(() => {
    scheduleDirtyCheck();

    if (draftStorageKey) {
      window.setTimeout(() => persistDraft(draftStorageKey, formRef.current), 0);
    }

    return () => {
      if (dirtyFrameRef.current !== null) {
        cancelAnimationFrame(dirtyFrameRef.current);
      }
    };
    // This effect intentionally tracks form state that is mirrored into hidden form values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    audioAssetId,
    draftStorageKey,
    newTagInput,
    selectedSpeakerIds,
    selectedSubjectIds,
    tagsJson,
    transcriptJson,
  ]);

  useEffect(() => {
    if (!autosaveSlug) {
      return;
    }

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      const { dirty, saving, failed } = beforeUnloadStateRef.current;

      if (dirty || saving || failed) {
        event.preventDefault();
        event.returnValue = "";
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [autosaveSlug]);

  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current !== null) {
        window.clearTimeout(autosaveTimerRef.current);
      }
    };
  }, []);

  async function uploadAudio() {
    const file = fileInputRef.current?.files?.[0];

    if (!file) {
      setUploadError("Choose an audio file first.");
      return;
    }

    setUploading(true);
    setUploadError("");

    try {
      const presignResponse = await fetch("/api/admin/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || "audio/mpeg",
          sizeBytes: file.size,
        }),
      });

      if (!presignResponse.ok) {
        throw new Error(await presignResponse.text());
      }

      const presign = await presignResponse.json();
      const uploadResponse = await fetch(presign.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "audio/mpeg" },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error("S3 upload failed.");
      }

      const completeResponse = await fetch("/api/admin/audio-assets/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioAssetId: presign.audioAssetId }),
      });

      if (!completeResponse.ok) {
        throw new Error(await completeResponse.text());
      }

      const completed = await completeResponse.json();
      setAudioAssetId(presign.audioAssetId);
      setAudioSrc(completed.playbackUrl ?? "");
      setUploadedAudioAssets((current) =>
        current.some((asset) => asset.id === presign.audioAssetId)
          ? current
          : [
              {
                id: presign.audioAssetId,
                originalFilename: file.name,
              },
              ...current,
            ],
      );
      router.refresh();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function updateSegment(index: number, patch: Partial<TranscriptSegment>) {
    setSegments((current) =>
      current.map((segment, segmentIndex) =>
        segmentIndex === index ? { ...segment, ...patch } : segment,
      ),
    );
  }

  function addSegment() {
    const previous = segments.at(-1);
    const start = previous?.end ?? 0;
    setSegments((current) => [
      ...current,
      {
        start,
        end: start + 5,
        text: "",
        speakerId: onlySelectedSpeakerId,
      },
    ]);
  }

  function splitSegment(index: number) {
    const segment = segments[index];
    const midpoint = Math.round(((segment.start + segment.end) / 2) * 100) / 100;

    setSegments((current) =>
      current.flatMap((item, itemIndex) =>
        itemIndex === index
          ? [
              { ...item, end: midpoint },
              { ...item, start: midpoint, text: "" },
            ]
          : [item],
      ),
    );
  }

  function deleteSegment(index: number) {
    setSegments((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function scheduleDirtyCheck() {
    if (dirtyFrameRef.current !== null) {
      cancelAnimationFrame(dirtyFrameRef.current);
    }

    dirtyFrameRef.current = requestAnimationFrame(() => {
      dirtyFrameRef.current = null;
      const dirty =
        getFormSnapshot(formRef.current) !== savedFormSnapshotRef.current;

      beforeUnloadStateRef.current = {
        dirty,
        saving: autosaveInFlightRef.current,
        failed: false,
      };
      dispatchEditorState({
        dirty,
        saveStatus: autosaveInFlightRef.current ? "saving" : "idle",
      });

      if (dirty && autosaveSlugRef.current) {
        scheduleAutosave();
      } else if (!dirty && autosaveTimerRef.current !== null) {
        window.clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
    });
  }

  function scheduleAutosave() {
    if (!autosaveSlugRef.current) {
      return;
    }

    if (autosaveTimerRef.current !== null) {
      window.clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = window.setTimeout(() => {
      autosaveTimerRef.current = null;
      void autosaveDraft();
    }, 1200);
  }

  async function autosaveDraft({
    force = false,
    throwOnError = false,
  } = {}) {
    const form = formRef.current;
    const currentSlug = autosaveSlugRef.current;

    if (!form || !currentSlug) {
      return;
    }

    if (autosaveInFlightRef.current) {
      scheduleAutosave();
      return;
    }

    const snapshotAtSaveStart = getFormSnapshot(form);

    if (!force && snapshotAtSaveStart === savedFormSnapshotRef.current) {
      beforeUnloadStateRef.current = {
        dirty: false,
        saving: false,
        failed: false,
      };
      dispatchEditorState({ dirty: false, saveStatus: "idle" });
      return;
    }

    autosaveInFlightRef.current = true;
    beforeUnloadStateRef.current = { dirty: true, saving: true, failed: false };
    dispatchEditorState({ dirty: true, saveStatus: "saving" });

    try {
      const response = await fetch(
        `/api/admin/microdoses/${encodeURIComponent(currentSlug)}/draft`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formDataToPayload(new FormData(form))),
        },
      );

      if (!response.ok) {
        throw new Error(await responseErrorMessage(response));
      }

      const result = (await response.json()) as { slug?: string };
      const nextSnapshot = getFormSnapshot(form);
      const dirty = nextSnapshot !== snapshotAtSaveStart;

      savedFormSnapshotRef.current = snapshotAtSaveStart;
      autosaveSlugRef.current = result.slug ?? currentSlug;
      autosaveInFlightRef.current = false;
      beforeUnloadStateRef.current = { dirty, saving: false, failed: false };
      dispatchEditorState({
        dirty,
        saveStatus: dirty ? "idle" : "saved",
        savedDraft: true,
      });

      if (result.slug && result.slug !== currentSlug) {
        router.replace(`/admin/microdoses/${result.slug}`);
      }

      if (dirty) {
        scheduleAutosave();
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Autosave failed. Try editing again or reload the page.";

      autosaveInFlightRef.current = false;
      beforeUnloadStateRef.current = { dirty: true, saving: false, failed: true };
      dispatchEditorState({
        dirty: true,
        saveStatus: "error",
        error: message,
      });

      if (throwOnError) {
        throw new Error(message);
      }
    }
  }

  function toggleTag(tag: TagOption) {
    setSelectedTags((current) => {
      const selected = current.some(
        (currentTag) =>
          currentTag.value.toLowerCase() === tag.value.toLowerCase(),
      );

      return selected
        ? current.filter(
            (currentTag) =>
              currentTag.value.toLowerCase() !== tag.value.toLowerCase(),
          )
        : [...current, tag];
    });
  }

  function addTagsFromInput() {
    const tags = parseInlineTags(newTagInput);

    if (tags.length === 0) {
      return;
    }

    setSelectedTags((current) => mergeTags(current, tags));
    setNewTagInput("");
  }

  function toggleSelectedId(
    id: string,
    setter: Dispatch<SetStateAction<string[]>>,
  ) {
    setter((current) =>
      current.includes(id)
        ? current.filter((currentId) => currentId !== id)
        : [...current, id],
    );
  }

  async function saveBeforeTranscribe() {
    await autosaveDraft({ force: true, throwOnError: true });
  }

  function handleFormInput() {
    scheduleDirtyCheck();

    if (draftStorageKey) {
      window.setTimeout(() => persistDraft(draftStorageKey, formRef.current), 0);
    }
  }

  function handleSubmit() {
    if (draftStorageKey) {
      window.sessionStorage.removeItem(draftStorageKey);
    }
  }

  return (
    <form
      ref={formRef}
      id={formId}
      action={action}
      onInput={handleFormInput}
      onChange={handleFormInput}
      onSubmit={handleSubmit}
      className="grid gap-8"
    >
      <input name="audioAssetId" type="hidden" value={audioAssetId} />
      <input name="tags" type="hidden" value={tagsJson} />
      <input name="transcriptJson" type="hidden" value={transcriptJson} />

      <section className="grid gap-5 border-[6px] border-foreground p-5">
        <h2 className="font-serif text-4xl font-black">Record</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" name="slug" defaultValue={value.slug} required />
          </div>
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" defaultValue={value.title} required />
          </div>
          <div>
            <Label htmlFor="speakerLabel">Speaker label</Label>
            <div className="grid gap-2">
              <select
                id="speakerLabel"
                name="speakerLabel"
                defaultValue={value.speakerLabel}
                required
                className="flex h-12 w-full border-2 border-input bg-background px-3 py-2 text-base"
              >
                <option value="">Select speaker</option>
                {value.speakerLabel &&
                !people.some((person) => person.name === value.speakerLabel) ? (
                  <option value={value.speakerLabel}>{value.speakerLabel}</option>
                ) : null}
                {people.map((person) => (
                  <option key={person.id} value={person.name}>
                    {person.name}
                  </option>
                ))}
              </select>
              <Link
                href={`/admin/people?returnTo=${encodeURIComponent(pathname)}`}
                prefetch={false}
                className="w-fit text-sm font-bold uppercase tracking-[0.08em] underline decoration-2 underline-offset-4"
              >
                Add speaker
              </Link>
            </div>
          </div>
          <div>
            <Label htmlFor="icon">Icon</Label>
            <select
              id="icon"
              name="icon"
              defaultValue={value.icon}
              className="flex h-12 w-full border-2 border-input bg-background px-3 py-2 text-base"
            >
              {microdoseIconNames.map((icon) => (
                <option key={icon} value={icon}>
                  {icon}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <Label htmlFor="description">Description Markdown</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={value.description}
            rows={6}
            required
          />
        </div>
        <div>
          <Label htmlFor="newTags">Tags</Label>
          <div className="grid gap-3 border-2 border-input p-3">
            {tagOptions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tagOptions.map((tag) => {
                  const selected = selectedTags.some(
                    (selectedTag) =>
                      selectedTag.value.toLowerCase() === tag.value.toLowerCase(),
                  );

                  return (
                    <label
                      key={tag.value}
                      className="inline-flex items-center gap-2 border-2 border-foreground px-3 py-2 text-sm font-bold"
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleTag(tag)}
                      />
                      <span>{tag.label}</span>
                    </label>
                  );
                })}
              </div>
            ) : null}
            <Input
              id="newTags"
              name="newTagsDraft"
              value={newTagInput}
              onChange={(event) => setNewTagInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addTagsFromInput();
                }
              }}
              placeholder="New tag"
            />
            <Button
              type="button"
              size="sm"
              className="w-fit"
              onClick={addTagsFromInput}
              disabled={parseInlineTags(newTagInput).length === 0}
            >
              <Plus aria-hidden="true" className="mr-2 size-4" />
              Add tag
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-5 border-[6px] border-foreground p-5">
        <h2 className="font-serif text-4xl font-black">Audio</h2>
        {audioSrc ? <audio controls src={audioSrc} className="w-full" /> : null}
        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          <div>
            <Label htmlFor="audioAsset">Uploaded asset</Label>
            <select
              id="audioAsset"
              value={audioAssetId}
              onChange={(event) => setAudioAssetId(event.target.value)}
              className="flex h-12 w-full border-2 border-input bg-background px-3 py-2 text-base"
            >
              <option value="">No audio selected</option>
              {availableAudioAssets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.originalFilename}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="audioUpload">Upload</Label>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                id="audioUpload"
                type="file"
                accept="audio/*"
                className="h-12 max-w-xs border-2 border-input bg-background px-3 py-2"
              />
              <Button type="button" onClick={uploadAudio} disabled={uploading}>
                <Upload aria-hidden="true" className="mr-2 size-4" />
                {uploading ? "Uploading" : "Upload"}
              </Button>
            </div>
          </div>
        </div>
        {uploadError ? <p className="font-bold text-cmm-coral">{uploadError}</p> : null}
      </section>

      <section className="grid gap-5 border-[6px] border-foreground p-5">
        <h2 className="font-serif text-4xl font-black">People</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <CheckboxGroup
            name="speakerIds"
            title="Featured speakers"
            options={people}
            selectedIds={selectedSpeakerIds}
            onToggle={(id) => toggleSelectedId(id, setSelectedSpeakerIds)}
          />
          <CheckboxGroup
            name="subjectIds"
            title="People mentioned"
            options={people}
            selectedIds={selectedSubjectIds}
            onToggle={(id) => toggleSelectedId(id, setSelectedSubjectIds)}
          />
        </div>
      </section>

      {autosaveSlug ? (
      <section className="grid gap-5 border-[6px] border-foreground p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-serif text-4xl font-black">Transcript</h2>
          <div className="flex flex-wrap gap-2">
            <TranscribeButton
              slug={autosaveSlug}
              onBeforeTranscribe={saveBeforeTranscribe}
            />
            <Button type="button" onClick={addSegment}>
              <Plus aria-hidden="true" className="mr-2 size-4" />
              Add chunk
            </Button>
          </div>
        </div>
        <div className="grid gap-3">
          {segments.map((segment, index) => (
            <div
              key={index}
              className="grid gap-3 border-2 border-foreground p-3 lg:grid-cols-[6rem_6rem_12rem_1fr_auto]"
            >
              <Input
                aria-label="Start seconds"
                type="number"
                min="0"
                step="0.01"
                value={segment.start}
                onChange={(event) =>
                  updateSegment(index, { start: Number(event.target.value) })
                }
              />
              <Input
                aria-label="End seconds"
                type="number"
                min="0"
                step="0.01"
                value={segment.end}
                onChange={(event) =>
                  updateSegment(index, { end: Number(event.target.value) })
                }
              />
              <select
                aria-label="Speaker"
                value={segment.speakerId ?? ""}
                onChange={(event) =>
                  updateSegment(index, {
                    speakerId: event.target.value || undefined,
                  })
                }
                className="h-12 border-2 border-input bg-background px-3 py-2"
              >
                <option value="">No speaker</option>
                {people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
              <Textarea
                aria-label="Transcript text"
                value={segment.text}
                rows={2}
                onChange={(event) =>
                  updateSegment(index, { text: event.target.value })
                }
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  aria-label="Split transcript chunk"
                  onClick={() => splitSegment(index)}
                >
                  <Scissors aria-hidden="true" className="size-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  aria-label="Delete transcript chunk"
                  onClick={() => deleteSegment(index)}
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>
      ) : null}

      {hideSubmitButton ? null : (
        <Button type="submit" variant="primary" className="w-fit">
          {submitLabel}
        </Button>
      )}
    </form>
  );
}

function dispatchEditorState({
  dirty,
  saveStatus,
  savedDraft = false,
  error = "",
}: {
  dirty: boolean;
  saveStatus: "idle" | "saving" | "saved" | "error";
  savedDraft?: boolean;
  error?: string;
}) {
  window.dispatchEvent(
    new CustomEvent("cmm:microdose-editor-dirty", {
      detail: { dirty, saveStatus, savedDraft, error },
    }),
  );
}

function formDataToPayload(formData: FormData) {
  return {
    slug: stringValue(formData.get("slug")),
    title: stringValue(formData.get("title")),
    description: stringValue(formData.get("description")),
    speakerLabel: stringValue(formData.get("speakerLabel")),
    icon: stringValue(formData.get("icon")),
    audioAssetId: stringValue(formData.get("audioAssetId")),
    tags: stringValue(formData.get("tags")),
    transcriptJson: stringValue(formData.get("transcriptJson")),
    newTagsDraft: stringValue(formData.get("newTagsDraft")),
    speakerIds: stringValues(formData.getAll("speakerIds")),
    subjectIds: stringValues(formData.getAll("subjectIds")),
  };
}

function stringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

function stringValues(values: FormDataEntryValue[]) {
  return values.filter((value): value is string => typeof value === "string");
}

async function responseErrorMessage(response: Response) {
  try {
    const body = (await response.json()) as { error?: unknown };

    if (typeof body.error === "string") {
      return body.error;
    }
  } catch {
    // Fall back to the generic status message below.
  }

  return response.statusText || "Autosave failed.";
}

function getFormSnapshot(form: HTMLFormElement | null) {
  if (!form) {
    return "";
  }

  const entries = Array.from(new FormData(form).entries())
    .filter(([name, value]) => name !== "audioUpload" && typeof value === "string")
    .map(([name, value]) => [name, value as string])
    .sort(([nameA, valueA], [nameB, valueB]) =>
      `${nameA}\u0000${valueA}`.localeCompare(`${nameB}\u0000${valueB}`),
    );

  return JSON.stringify(entries);
}

function parseInlineTags(value: string): TagOption[] {
  const seen = new Set<string>();

  return value
    .split(/,|\r?\n/)
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => {
      const normalizedValue = part.toLowerCase();

      if (seen.has(normalizedValue)) {
        return false;
      }

      seen.add(normalizedValue);
      return true;
    })
    .map((part) => ({ value: part, label: part }));
}

function mergeTags(current: TagOption[], next: TagOption[]) {
  const seen = new Set(current.map((tag) => tag.value.toLowerCase()));
  const merged = [...current];

  for (const tag of next) {
    const normalizedValue = tag.value.toLowerCase();

    if (!seen.has(normalizedValue)) {
      seen.add(normalizedValue);
      merged.push(tag);
    }
  }

  return merged;
}

function persistDraft(storageKey: string, form: HTMLFormElement | null) {
  if (!form) {
    return;
  }

  window.sessionStorage.setItem(
    storageKey,
    JSON.stringify(formDataToPayload(new FormData(form))),
  );
}

function restoreDraft(
  payload: unknown,
  form: HTMLFormElement | null,
  setters: {
    setAudioAssetId: Dispatch<SetStateAction<string>>;
    setSelectedTags: Dispatch<SetStateAction<TagOption[]>>;
    setSelectedSpeakerIds: Dispatch<SetStateAction<string[]>>;
    setSelectedSubjectIds: Dispatch<SetStateAction<string[]>>;
    setSegments: Dispatch<SetStateAction<TranscriptSegment[]>>;
    setNewTagInput: Dispatch<SetStateAction<string>>;
  },
) {
  if (!form || typeof payload !== "object" || payload === null) {
    return;
  }

  const draft = payload as Record<string, unknown>;
  setInputValue(form, "slug", draft.slug);
  setInputValue(form, "title", draft.title);
  setInputValue(form, "description", draft.description);
  setInputValue(form, "speakerLabel", draft.speakerLabel);
  setInputValue(form, "icon", draft.icon);

  setters.setAudioAssetId(typeof draft.audioAssetId === "string" ? draft.audioAssetId : "");
  setters.setSelectedTags(
    typeof draft.tags === "string" ? parseTags(draft.tags) : [],
  );
  setters.setSelectedSpeakerIds(stringArrayValue(draft.speakerIds));
  setters.setSelectedSubjectIds(stringArrayValue(draft.subjectIds));
  setters.setNewTagInput(
    typeof draft.newTagsDraft === "string" ? draft.newTagsDraft : "",
  );

  if (typeof draft.transcriptJson === "string" && draft.transcriptJson.trim()) {
    const transcript = JSON.parse(draft.transcriptJson);

    if (Array.isArray(transcript)) {
      setters.setSegments(transcript as TranscriptSegment[]);
    }
  }
}

function setInputValue(
  form: HTMLFormElement,
  name: string,
  value: unknown,
) {
  const field = form.elements.namedItem(name);

  if (
    typeof value === "string" &&
    (field instanceof HTMLInputElement ||
      field instanceof HTMLTextAreaElement ||
      field instanceof HTMLSelectElement)
  ) {
    field.value = value;
  }
}

function stringArrayValue(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function CheckboxGroup({
  name,
  title,
  options,
  selectedIds,
  onToggle,
}: {
  name: string;
  title: string;
  options: PersonOption[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <fieldset className="border-2 border-foreground p-4">
      <legend className="px-2 font-bold uppercase">{title}</legend>
      <div className="grid gap-2">
        {options.map((option) => (
          <label key={option.id} className="flex items-center gap-2">
            <input
              name={name}
              type="checkbox"
              value={option.id}
              checked={selectedIds.includes(option.id)}
              onChange={() => onToggle(option.id)}
            />
            <span>{option.name}</span>
          </label>
        ))}
        {options.length === 0 ? <p>No records yet.</p> : null}
      </div>
    </fieldset>
  );
}
