import type {
  EditableMicrodoseInput,
} from "@/lib/admin/microdose-repository";
import {
  microdoseIconNames,
  type MicrodoseIcon,
} from "@/lib/microdose-constants";
import type { MicrodoseTag, TranscriptSegment } from "@/lib/microdoses";

export function stringField(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

export function optionalStringField(formData: FormData, name: string) {
  return stringField(formData, name) || undefined;
}

export function stringListField(formData: FormData, name: string) {
  return formData
    .getAll(name)
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function parseTags(value: string): MicrodoseTag[] {
  const tags = value
    .split(/\r?\n|,/)
    .flatMap((line) => parseTagLine(line))
    .filter((tag, index, allTags) => {
      const normalizedValue = tag.value.toLowerCase();

      return (
        allTags.findIndex(
          (candidate) => candidate.value.toLowerCase() === normalizedValue,
        ) === index
      );
    });

  return tags;
}

export function serializeTags(tags: MicrodoseTag[]) {
  return tags.map((tag) => `${tag.value}|${tag.label}`).join("\n");
}

function parseTagLine(line: string): MicrodoseTag[] {
  const parts = line
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return [];
  }

  if (parts.length === 2) {
    return [{ value: parts[0], label: parts[1] }];
  }

  return parts.map((part) => ({ value: part, label: part }));
}

export function parseTranscriptJson(value: string): TranscriptSegment[] {
  if (!value.trim()) {
    return [];
  }

  const parsed: unknown = JSON.parse(value);

  if (!Array.isArray(parsed)) {
    throw new Error("Transcript JSON must be an array.");
  }

  return parsed.map((segment, index) => {
    if (typeof segment !== "object" || segment === null) {
      throw new Error(`Transcript segment ${index + 1} must be an object.`);
    }

    const input = segment as Record<string, unknown>;
    const start = Number(input.start);
    const end = Number(input.end);
    const text = typeof input.text === "string" ? input.text.trim() : "";
    const speakerId =
      typeof input.speakerId === "string" && input.speakerId.trim()
        ? input.speakerId.trim()
        : undefined;

    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      throw new Error(`Transcript segment ${index + 1} has invalid boundaries.`);
    }

    if (!text) {
      throw new Error(`Transcript segment ${index + 1} is missing text.`);
    }

    return { start, end, text, speakerId };
  });
}

export function microdoseInputFromForm(formData: FormData): EditableMicrodoseInput {
  const icon = stringField(formData, "icon") as MicrodoseIcon;

  if (!microdoseIconNames.includes(icon)) {
    throw new Error(`Unsupported icon "${icon}".`);
  }

  return {
    slug: stringField(formData, "slug"),
    title: stringField(formData, "title"),
    description: stringField(formData, "description"),
    speakerLabel: stringField(formData, "speakerLabel"),
    icon,
    audioAssetId: optionalStringField(formData, "audioAssetId") ?? null,
    tags: parseTags(stringField(formData, "tags")),
    speakerIds: stringListField(formData, "speakerIds"),
    subjectIds: stringListField(formData, "subjectIds"),
    transcript: parseTranscriptJson(stringField(formData, "transcriptJson")),
  };
}
