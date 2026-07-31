import fs from "node:fs";
import path from "node:path";

export type MicrodoseIcon = "ghost" | "octopus" | "signal" | "molecule";

export type MicrodoseSubject = {
  id: string;
  name: string;
  role?: string;
  bio: string;
};

export type MicrodoseSpeaker = {
  id: string;
  name: string;
  role?: string;
};

export type MicrodoseTabColorPair = {
  surface: string;
  icon: string;
};

export type TranscriptSegment = {
  start: number;
  end: number;
  text: string;
  speakerId?: string;
  speaker?: MicrodoseSpeaker;
};

export type AudioMicrodoseMedia = {
  type: "audio";
  src: string;
  durationSeconds?: number;
};

export type Microdose = {
  id: string;
  title: string;
  description: string;
  speakerLabel: string;
  icon: MicrodoseIcon;
  tags: string[];
  tabColorPairs: MicrodoseTabColorPair[];
  media: AudioMicrodoseMedia;
  speakers: MicrodoseSpeaker[];
  subjects: MicrodoseSubject[];
  transcript: TranscriptSegment[];
};

const contentDirectory = path.join(process.cwd(), "content", "microdoses");
const subjectsPath = path.join(process.cwd(), "content", "subjects.json");
const speakersPath = path.join(process.cwd(), "content", "speakers.json");
const iconNames = new Set<MicrodoseIcon>([
  "ghost",
  "octopus",
  "signal",
  "molecule",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown, field: string) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Microdose ${field} must be a non-empty string.`);
  }

  return value;
}

function readOptionalNumber(value: unknown, field: string) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
    throw new Error(`Microdose ${field} must be a positive number.`);
  }

  return value;
}

function readStringArray(value: unknown, field: string) {
  if (!Array.isArray(value)) {
    throw new Error(`Microdose ${field} must be an array.`);
  }

  return value.map((item, index) => readString(item, `${field}[${index}]`));
}

function validateSubjects(input: unknown) {
  if (!Array.isArray(input)) {
    throw new Error("Subjects registry must be an array.");
  }

  const subjects = input.map((subject, index) => {
    if (!isRecord(subject)) {
      throw new Error(`Subject registry item ${index} must be an object.`);
    }

    return {
      id: readString(subject.id, `subjects[${index}].id`),
      name: readString(subject.name, `subjects[${index}].name`),
      role:
        subject.role === undefined
          ? undefined
          : readString(subject.role, `subjects[${index}].role`),
      bio: readString(subject.bio, `subjects[${index}].bio`),
    };
  });

  const subjectIds = new Set<string>();
  for (const subject of subjects) {
    if (subjectIds.has(subject.id)) {
      throw new Error(`Duplicate subject id "${subject.id}".`);
    }

    subjectIds.add(subject.id);
  }

  return subjects;
}

function validateSpeakers(input: unknown) {
  if (!Array.isArray(input)) {
    throw new Error("Speakers registry must be an array.");
  }

  const speakers = input.map((speaker, index) => {
    if (!isRecord(speaker)) {
      throw new Error(`Speaker registry item ${index} must be an object.`);
    }

    return {
      id: readString(speaker.id, `speakers[${index}].id`),
      name: readString(speaker.name, `speakers[${index}].name`),
      role:
        speaker.role === undefined
          ? undefined
          : readString(speaker.role, `speakers[${index}].role`),
    };
  });

  const speakerIds = new Set<string>();
  for (const speaker of speakers) {
    if (speakerIds.has(speaker.id)) {
      throw new Error(`Duplicate speaker id "${speaker.id}".`);
    }

    speakerIds.add(speaker.id);
  }

  return speakers;
}

function getSubjectMap() {
  const contents = fs.readFileSync(subjectsPath, "utf8");
  const subjects = validateSubjects(JSON.parse(contents));

  return new Map(subjects.map((subject) => [subject.id, subject]));
}

function getSpeakerMap() {
  const contents = fs.readFileSync(speakersPath, "utf8");
  const speakers = validateSpeakers(JSON.parse(contents));

  return new Map(speakers.map((speaker) => [speaker.id, speaker]));
}

function readTabColorPairs(value: unknown, field: string) {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new Error(`Microdose ${field} must be an array.`);
  }

  return value.map((pair, index) => {
    if (!isRecord(pair)) {
      throw new Error(`Microdose ${field}[${index}] must be an object.`);
    }

    return {
      surface: readString(pair.surface, `${field}[${index}].surface`),
      icon: readString(pair.icon, `${field}[${index}].icon`),
    };
  });
}

export function validateMicrodose(
  input: unknown,
  subjectMap = getSubjectMap(),
  speakerMap = getSpeakerMap(),
): Microdose {
  if (!isRecord(input)) {
    throw new Error("Microdose record must be an object.");
  }

  const media = input.media;
  if (!isRecord(media) || media.type !== "audio") {
    throw new Error("Microdose media.type must be audio.");
  }

  const subjectIds = readStringArray(input.subjectIds, "subjectIds");
  const speakerIds = readStringArray(input.speakerIds ?? [], "speakerIds");
  const microdoseSpeakerIds = new Set(speakerIds);

  const transcript = input.transcript;
  if (!Array.isArray(transcript)) {
    throw new Error("Microdose transcript must be an array.");
  }

  const icon = readString(input.icon, "icon");
  if (!iconNames.has(icon as MicrodoseIcon)) {
    throw new Error(`Microdose icon "${icon}" is not supported.`);
  }

  return {
    id: readString(input.id, "id"),
    title: readString(input.title, "title"),
    description: readString(input.description, "description"),
    speakerLabel: readString(input.speakerLabel, "speakerLabel"),
    icon: icon as MicrodoseIcon,
    tags: readStringArray(input.tags ?? [], "tags"),
    tabColorPairs: readTabColorPairs(input.tabColorPairs, "tabColorPairs"),
    media: {
      type: "audio",
      src: readString(media.src, "media.src"),
      durationSeconds: readOptionalNumber(
        media.durationSeconds,
        "media.durationSeconds",
      ),
    },
    subjects: subjectIds.map((subjectId) => {
      const subject = subjectMap.get(subjectId);

      if (!subject) {
        throw new Error(`Microdose subject "${subjectId}" was not found.`);
      }

      return subject;
    }),
    speakers: speakerIds.map((speakerId) => {
      const speaker = speakerMap.get(speakerId);

      if (!speaker) {
        throw new Error(`Microdose speaker "${speakerId}" was not found.`);
      }

      return speaker;
    }),
    transcript: transcript.map((segment, index) => {
      if (!isRecord(segment)) {
        throw new Error(`Microdose transcript[${index}] must be an object.`);
      }

      const start = readOptionalNumber(
        segment.start,
        `transcript[${index}].start`,
      );
      const end = readOptionalNumber(segment.end, `transcript[${index}].end`);

      if (start === undefined || end === undefined || end <= start) {
        throw new Error(
          `Microdose transcript[${index}] must have valid start/end times.`,
        );
      }

      const speakerId =
        segment.speakerId === undefined
          ? undefined
          : readString(segment.speakerId, `transcript[${index}].speakerId`);
      const speaker = speakerId ? speakerMap.get(speakerId) : undefined;

      if (speakerId && !speaker) {
        throw new Error(
          `Microdose transcript[${index}].speakerId "${speakerId}" was not found.`,
        );
      }

      if (speakerId && !microdoseSpeakerIds.has(speakerId)) {
        throw new Error(
          `Microdose transcript[${index}].speakerId "${speakerId}" is not listed in speakerIds.`,
        );
      }

      return {
        start,
        end,
        text: readString(segment.text, `transcript[${index}].text`),
        speakerId,
        speaker,
      };
    }),
  };
}

export function getAllMicrodoses() {
  const subjectMap = getSubjectMap();
  const speakerMap = getSpeakerMap();
  const files = fs
    .readdirSync(contentDirectory)
    .filter((file) => file.endsWith(".json"))
    .sort();

  return files.map((file) => {
    const recordPath = path.join(contentDirectory, file);
    const contents = fs.readFileSync(recordPath, "utf8");

    return validateMicrodose(JSON.parse(contents), subjectMap, speakerMap);
  });
}

export function getMicrodoseById(id: string) {
  return getAllMicrodoses().find((microdose) => microdose.id === id) ?? null;
}

export function getMicrodoseTags() {
  return Array.from(
    new Set(getAllMicrodoses().flatMap((microdose) => microdose.tags)),
  ).sort();
}
