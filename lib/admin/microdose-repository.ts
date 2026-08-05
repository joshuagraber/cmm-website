import { and, asc, desc, eq } from "drizzle-orm";
import { getDb, hasDatabase } from "@/lib/db/client";
import {
  audioAssets,
  microdoseRevisionSpeakers,
  microdoseRevisionSubjects,
  microdoseRevisionTags,
  microdoseRevisions,
  microdoses,
  people,
  transcriptSegments,
  transcriptionJobs,
} from "@/lib/db/schema";
import { createAudioPlaybackUrl } from "@/lib/storage";
import type {
  Microdose,
  MicrodoseIcon,
  MicrodoseTag,
  TranscriptSegment,
} from "@/lib/microdoses";

type Db = ReturnType<typeof getDb>;
type Transaction = Parameters<Parameters<Db["transaction"]>[0]>[0];
type RevisionWriter = Db | Transaction;

export type AdminMicrodoseListItem = {
  id: string;
  slug: string;
  title: string;
  status: "draft" | "published" | "staged" | "archived";
  updatedAt: Date;
};

export type AdminMicrodoseEditor = {
  id: string;
  slug: string;
  archived: boolean;
  isPublished: boolean;
  hasStagedChanges: boolean;
  draftRevisionId: string;
  draftUpdatedAt: Date;
  title: string;
  description: string;
  speakerLabel: string;
  icon: MicrodoseIcon;
  audioAssetId: string | null;
  audioSrc: string | null;
  tags: MicrodoseTag[];
  speakerIds: string[];
  subjectIds: string[];
  transcript: TranscriptSegment[];
};

export type EditableMicrodoseInput = {
  slug: string;
  title: string;
  description: string;
  speakerLabel: string;
  icon: MicrodoseIcon;
  audioAssetId?: string | null;
  tags: MicrodoseTag[];
  speakerIds: string[];
  subjectIds: string[];
  transcript: TranscriptSegment[];
};

export function requireDatabase() {
  if (!hasDatabase()) {
    throw new Error("Admin CMS requires DATABASE_URL.");
  }
}

export async function listAdminMicrodoses(): Promise<AdminMicrodoseListItem[]> {
  requireDatabase();
  const db = getDb();
  const rows = await db
    .select({
      id: microdoses.id,
      slug: microdoses.slug,
      archived: microdoses.archived,
      draftRevisionId: microdoses.draftRevisionId,
      publishedRevisionId: microdoses.publishedRevisionId,
      updatedAt: microdoses.updatedAt,
      title: microdoseRevisions.title,
    })
    .from(microdoses)
    .leftJoin(
      microdoseRevisions,
      eq(microdoseRevisions.id, microdoses.draftRevisionId),
    )
    .orderBy(desc(microdoses.updatedAt));

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title ?? row.slug,
    status: row.archived
      ? "archived"
      : row.publishedRevisionId
        ? row.publishedRevisionId === row.draftRevisionId
          ? "published"
          : "staged"
        : "draft",
    updatedAt: row.updatedAt,
  }));
}

export async function getPublishedMicrodosesFromDb(): Promise<Microdose[]> {
  requireDatabase();
  const db = getDb();
  const rows = await db
    .select({
      slug: microdoses.slug,
      revisionId: microdoseRevisions.id,
      title: microdoseRevisions.title,
      description: microdoseRevisions.descriptionMarkdown,
      speakerLabel: microdoseRevisions.speakerLabel,
      icon: microdoseRevisions.icon,
      audioKey: audioAssets.s3Key,
      audioPublicPath: audioAssets.publicPath,
      durationSeconds: audioAssets.durationSeconds,
    })
    .from(microdoses)
    .innerJoin(
      microdoseRevisions,
      eq(microdoseRevisions.id, microdoses.publishedRevisionId),
    )
    .leftJoin(audioAssets, eq(audioAssets.id, microdoseRevisions.audioAssetId))
    .where(and(eq(microdoses.archived, false)))
    .orderBy(desc(microdoses.updatedAt));

  return Promise.all(rows.map((row) => hydrateMicrodose(row)));
}

export async function getPublishedMicrodoseFromDb(slug: string) {
  const microdose = (await getPublishedMicrodosesFromDb()).find(
    (item) => item.id === slug,
  );

  return microdose ?? null;
}

export async function listPeople() {
  requireDatabase();
  return getDb().select().from(people).orderBy(asc(people.name));
}

export async function listAudioAssets() {
  requireDatabase();
  return getDb().select().from(audioAssets).orderBy(desc(audioAssets.createdAt));
}

export async function listMicrodoseTags(): Promise<MicrodoseTag[]> {
  requireDatabase();
  const rows = await getDb()
    .select({
      value: microdoseRevisionTags.value,
      label: microdoseRevisionTags.labelMarkdown,
    })
    .from(microdoseRevisionTags)
    .orderBy(asc(microdoseRevisionTags.value));
  const seen = new Set<string>();
  const tags: MicrodoseTag[] = [];

  for (const row of rows) {
    const normalizedValue = row.value.toLowerCase();

    if (!seen.has(normalizedValue)) {
      seen.add(normalizedValue);
      tags.push({ value: row.value, label: row.label });
    }
  }

  return tags;
}

export async function getAdminMicrodose(slug: string) {
  requireDatabase();
  const db = getDb();
  const [row] = await db.select().from(microdoses).where(eq(microdoses.slug, slug));

  if (!row?.draftRevisionId) {
    return null;
  }

  const [revision] = await db
    .select()
    .from(microdoseRevisions)
    .where(eq(microdoseRevisions.id, row.draftRevisionId));

  if (!revision) {
    return null;
  }

  const [asset] = revision.audioAssetId
    ? await db.select().from(audioAssets).where(eq(audioAssets.id, revision.audioAssetId))
    : [];

  const [tagRows, speakerRows, subjectRows, segmentRows] = await Promise.all([
    db
      .select()
      .from(microdoseRevisionTags)
      .where(eq(microdoseRevisionTags.revisionId, revision.id))
      .orderBy(asc(microdoseRevisionTags.value)),
    db
      .select()
      .from(microdoseRevisionSpeakers)
      .where(eq(microdoseRevisionSpeakers.revisionId, revision.id)),
    db
      .select()
      .from(microdoseRevisionSubjects)
      .where(eq(microdoseRevisionSubjects.revisionId, revision.id)),
    db
      .select()
      .from(transcriptSegments)
      .where(eq(transcriptSegments.revisionId, revision.id))
      .orderBy(asc(transcriptSegments.orderIndex)),
  ]);

  return {
    id: row.id,
    slug: row.slug,
    archived: row.archived,
    isPublished: Boolean(row.publishedRevisionId),
    hasStagedChanges: Boolean(
      row.publishedRevisionId && row.publishedRevisionId !== revision.id,
    ),
    draftRevisionId: revision.id,
    draftUpdatedAt: revision.updatedAt,
    title: revision.title,
    description: revision.descriptionMarkdown,
    speakerLabel: revision.speakerLabel,
    icon: revision.icon as MicrodoseIcon,
    audioAssetId: revision.audioAssetId,
    audioSrc: asset
      ? (asset.publicPath ?? (await createAudioPlaybackUrl(asset.s3Key)))
      : null,
    tags: tagRows.map((tag) => ({ value: tag.value, label: tag.labelMarkdown })),
    speakerIds: speakerRows.map((speaker) => speaker.speakerId),
    subjectIds: subjectRows.map((subject) => subject.subjectId),
    transcript: segmentRows.map((segment) => ({
      start: segment.startMs / 1000,
      end: segment.endMs / 1000,
      text: segment.text,
      speakerId: segment.speakerId ?? undefined,
    })),
  } satisfies AdminMicrodoseEditor;
}

export async function createMicrodose(input: EditableMicrodoseInput) {
  requireDatabase();
  const db = getDb();

  return db.transaction(async (tx) => {
    const [microdose] = await tx
      .insert(microdoses)
      .values({ slug: input.slug })
      .returning();
    const [revision] = await tx
      .insert(microdoseRevisions)
      .values(toRevisionValues(microdose.id, input))
      .returning();

    await syncRevisionCollections(tx, revision.id, input);
    await tx
      .update(microdoses)
      .set({ draftRevisionId: revision.id, updatedAt: new Date() })
      .where(eq(microdoses.id, microdose.id));

    return microdose.slug;
  });
}

export async function updateDraftMicrodose(slug: string, input: EditableMicrodoseInput) {
  requireDatabase();
  const db = getDb();

  await db.transaction(async (tx) => {
    const [microdose] = await tx
      .select()
      .from(microdoses)
      .where(eq(microdoses.slug, slug));

    if (!microdose?.draftRevisionId) {
      throw new Error(`Microdose "${slug}" was not found.`);
    }

    if (microdose.publishedRevisionId === microdose.draftRevisionId) {
      const [revision] = await tx
        .insert(microdoseRevisions)
        .values(toRevisionValues(microdose.id, input))
        .returning();
      await syncRevisionCollections(tx, revision.id, input);
      await tx
        .update(microdoses)
        .set({
          slug: input.slug,
          draftRevisionId: revision.id,
          updatedAt: new Date(),
        })
        .where(eq(microdoses.id, microdose.id));
    } else {
      await tx
        .update(microdoses)
        .set({ slug: input.slug, updatedAt: new Date() })
        .where(eq(microdoses.id, microdose.id));
      await tx
        .update(microdoseRevisions)
        .set({ ...toRevisionValues(microdose.id, input), updatedAt: new Date() })
        .where(eq(microdoseRevisions.id, microdose.draftRevisionId));
      await clearRevisionCollections(tx, microdose.draftRevisionId);
      await syncRevisionCollections(tx, microdose.draftRevisionId, input);
    }
  });
}

export async function publishMicrodose(slug: string) {
  requireDatabase();
  const db = getDb();
  const [microdose] = await db.select().from(microdoses).where(eq(microdoses.slug, slug));

  if (!microdose?.draftRevisionId) {
    throw new Error(`Microdose "${slug}" was not found.`);
  }

  await db
    .update(microdoses)
    .set({
      archived: false,
      publishedRevisionId: microdose.draftRevisionId,
      updatedAt: new Date(),
    })
    .where(eq(microdoses.id, microdose.id));
}

export async function unpublishMicrodose(slug: string) {
  requireDatabase();
  await getDb()
    .update(microdoses)
    .set({ publishedRevisionId: null, updatedAt: new Date() })
    .where(eq(microdoses.slug, slug));
}

export async function archiveMicrodose(slug: string) {
  requireDatabase();
  await getDb()
    .update(microdoses)
    .set({ archived: true, publishedRevisionId: null, updatedAt: new Date() })
    .where(eq(microdoses.slug, slug));
}

export async function upsertPerson(input: { id?: string; name: string; bio?: string }) {
  requireDatabase();
  const id = input.id || slugifyPersonName(input.name);

  await getDb()
    .insert(people)
    .values({
      id,
      name: input.name,
      bioMarkdown: input.bio ?? "",
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: people.id,
      set: {
        name: input.name,
        bioMarkdown: input.bio ?? "",
        updatedAt: new Date(),
      },
    });

  return id;
}

export async function createAudioAsset(input: {
  s3Key: string;
  publicPath?: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes?: number;
  durationSeconds?: number;
  uploadStatus?: string;
}) {
  requireDatabase();
  const [asset] = await getDb()
    .insert(audioAssets)
    .values({
      s3Key: input.s3Key,
      publicPath: input.publicPath,
      originalFilename: input.originalFilename,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      durationSeconds: input.durationSeconds,
      uploadStatus: input.uploadStatus ?? "pending",
    })
    .returning();

  return asset;
}

export async function completeAudioAsset(id: string, durationSeconds?: number) {
  requireDatabase();
  await getDb()
    .update(audioAssets)
    .set({ uploadStatus: "complete", durationSeconds, updatedAt: new Date() })
    .where(eq(audioAssets.id, id));
}

export async function getAudioAssetPlaybackUrl(id: string) {
  requireDatabase();
  const [asset] = await getDb()
    .select()
    .from(audioAssets)
    .where(eq(audioAssets.id, id));

  if (!asset) {
    return null;
  }

  return asset.publicPath ?? createAudioPlaybackUrl(asset.s3Key);
}

export async function createTranscriptionJob(slug: string) {
  requireDatabase();
  const db = getDb();

  return db.transaction(async (tx) => {
    const [microdose] = await tx
      .select()
      .from(microdoses)
      .where(eq(microdoses.slug, slug));

    if (!microdose?.draftRevisionId) {
      throw new Error(`Microdose "${slug}" was not found.`);
    }

    const revisionId =
      microdose.publishedRevisionId === microdose.draftRevisionId
        ? await copyDraftRevision(tx, microdose.id, microdose.draftRevisionId)
        : microdose.draftRevisionId;

    if (revisionId !== microdose.draftRevisionId) {
      await tx
        .update(microdoses)
        .set({ draftRevisionId: revisionId, updatedAt: new Date() })
        .where(eq(microdoses.id, microdose.id));
    }

    const [revision] = await tx
      .select()
      .from(microdoseRevisions)
      .where(eq(microdoseRevisions.id, revisionId));

    if (!revision?.audioAssetId) {
      throw new Error("Attach an uploaded audio asset before transcribing.");
    }

    const [job] = await tx
      .insert(transcriptionJobs)
      .values({
        audioAssetId: revision.audioAssetId,
        revisionId,
      })
      .returning();

    return job;
  });
}

export async function getTranscriptionJobForProcessing(jobId: string) {
  requireDatabase();
  const db = getDb();
  const [job] = await db
    .select({
      id: transcriptionJobs.id,
      status: transcriptionJobs.status,
      attempts: transcriptionJobs.attempts,
      revisionId: transcriptionJobs.revisionId,
      audioAssetId: transcriptionJobs.audioAssetId,
      s3Key: audioAssets.s3Key,
    })
    .from(transcriptionJobs)
    .innerJoin(audioAssets, eq(audioAssets.id, transcriptionJobs.audioAssetId))
    .where(eq(transcriptionJobs.id, jobId));

  return job ?? null;
}

export async function markTranscriptionJobRunning(jobId: string) {
  requireDatabase();
  await getDb()
    .update(transcriptionJobs)
    .set({
      status: "running",
      attempts: 1,
      startedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(transcriptionJobs.id, jobId));
}

export async function markTranscriptionJobComplete(jobId: string) {
  requireDatabase();
  await getDb()
    .update(transcriptionJobs)
    .set({
      status: "complete",
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(transcriptionJobs.id, jobId));
}

export async function markTranscriptionJobFailed(jobId: string, error: string) {
  requireDatabase();
  await getDb()
    .update(transcriptionJobs)
    .set({
      status: "failed",
      error,
      updatedAt: new Date(),
    })
    .where(eq(transcriptionJobs.id, jobId));
}

export async function replaceRevisionTranscript(
  revisionId: string,
  transcript: TranscriptSegment[],
) {
  requireDatabase();
  const db = getDb();

  await db.transaction(async (tx) => {
    await tx
      .delete(transcriptSegments)
      .where(eq(transcriptSegments.revisionId, revisionId));

    if (transcript.length > 0) {
      await tx.insert(transcriptSegments).values(
        transcript.map((segment, index) => ({
          revisionId,
          orderIndex: index,
          startMs: Math.round(segment.start * 1000),
          endMs: Math.round(segment.end * 1000),
          text: segment.text,
          speakerId: segment.speakerId ?? null,
        })),
      );
    }
  });
}

async function hydrateMicrodose(row: {
  slug: string;
  revisionId: string;
  title: string;
  description: string;
  speakerLabel: string;
  icon: string;
  audioKey: string | null;
  audioPublicPath: string | null;
  durationSeconds: number | null;
}): Promise<Microdose> {
  const db = getDb();
  const [tagRows, speakerJoinRows, subjectJoinRows, segmentRows] = await Promise.all([
    db
      .select()
      .from(microdoseRevisionTags)
      .where(eq(microdoseRevisionTags.revisionId, row.revisionId))
      .orderBy(asc(microdoseRevisionTags.value)),
    db
      .select({
        id: people.id,
        name: people.name,
      })
      .from(microdoseRevisionSpeakers)
      .innerJoin(people, eq(people.id, microdoseRevisionSpeakers.speakerId))
      .where(eq(microdoseRevisionSpeakers.revisionId, row.revisionId)),
    db
      .select({
        id: people.id,
        name: people.name,
        bio: people.bioMarkdown,
      })
      .from(microdoseRevisionSubjects)
      .innerJoin(people, eq(people.id, microdoseRevisionSubjects.subjectId))
      .where(eq(microdoseRevisionSubjects.revisionId, row.revisionId)),
    db
      .select()
      .from(transcriptSegments)
      .where(eq(transcriptSegments.revisionId, row.revisionId))
      .orderBy(asc(transcriptSegments.orderIndex)),
  ]);
  const speakerMap = new Map(speakerJoinRows.map((speaker) => [speaker.id, speaker]));

  return {
    id: row.slug,
    title: row.title,
    description: row.description,
    speakerLabel: row.speakerLabel,
    icon: row.icon as MicrodoseIcon,
    tags: tagRows.map((tag) => ({ value: tag.value, label: tag.labelMarkdown })),
    tabColorPairs: [
      {
        surface: "var(--acid-tab-surface-a)",
        icon: "var(--brand-accent-cool)",
      },
      {
        surface: "var(--acid-tab-surface-b)",
        icon: "var(--brand-accent-warm)",
      },
    ],
    media: {
      type: "audio",
      src: row.audioPublicPath
        ? row.audioPublicPath
        : row.audioKey
          ? await createAudioPlaybackUrl(row.audioKey)
          : "",
      durationSeconds: row.durationSeconds ?? undefined,
    },
    speakers: speakerJoinRows.map((speaker) => ({
      id: speaker.id,
      name: speaker.name,
    })),
    subjects: subjectJoinRows.map((subject) => ({
      id: subject.id,
      name: subject.name,
      bio: subject.bio,
    })),
    transcript: segmentRows.map((segment) => ({
      start: segment.startMs / 1000,
      end: segment.endMs / 1000,
      text: segment.text,
      speakerId: segment.speakerId ?? undefined,
      speaker: segment.speakerId
        ? toOptionalSpeaker(speakerMap.get(segment.speakerId))
        : undefined,
    })),
  };
}

function toRevisionValues(microdoseId: string, input: EditableMicrodoseInput) {
  return {
    microdoseId,
    title: input.title,
    descriptionMarkdown: input.description,
    speakerLabel: input.speakerLabel,
    icon: input.icon,
    audioAssetId: input.audioAssetId || null,
  };
}

async function clearRevisionCollections(
  tx: RevisionWriter,
  revisionId: string,
) {
  await tx.delete(transcriptSegments).where(eq(transcriptSegments.revisionId, revisionId));
  await tx
    .delete(microdoseRevisionTags)
    .where(eq(microdoseRevisionTags.revisionId, revisionId));
  await tx
    .delete(microdoseRevisionSpeakers)
    .where(eq(microdoseRevisionSpeakers.revisionId, revisionId));
  await tx
    .delete(microdoseRevisionSubjects)
    .where(eq(microdoseRevisionSubjects.revisionId, revisionId));
}

async function copyDraftRevision(
  tx: RevisionWriter,
  microdoseId: string,
  sourceRevisionId: string,
) {
  const [sourceRevision] = await tx
    .select()
    .from(microdoseRevisions)
    .where(eq(microdoseRevisions.id, sourceRevisionId));

  if (!sourceRevision) {
    throw new Error(`Revision "${sourceRevisionId}" was not found.`);
  }

  const [revision] = await tx
    .insert(microdoseRevisions)
    .values({
      microdoseId,
      title: sourceRevision.title,
      descriptionMarkdown: sourceRevision.descriptionMarkdown,
      speakerLabel: sourceRevision.speakerLabel,
      icon: sourceRevision.icon,
      audioAssetId: sourceRevision.audioAssetId,
    })
    .returning();

  const [tagRows, speakerRows, subjectRows, segmentRows] = await Promise.all([
    tx
      .select()
      .from(microdoseRevisionTags)
      .where(eq(microdoseRevisionTags.revisionId, sourceRevisionId)),
    tx
      .select()
      .from(microdoseRevisionSpeakers)
      .where(eq(microdoseRevisionSpeakers.revisionId, sourceRevisionId)),
    tx
      .select()
      .from(microdoseRevisionSubjects)
      .where(eq(microdoseRevisionSubjects.revisionId, sourceRevisionId)),
    tx
      .select()
      .from(transcriptSegments)
      .where(eq(transcriptSegments.revisionId, sourceRevisionId))
      .orderBy(asc(transcriptSegments.orderIndex)),
  ]);

  if (tagRows.length > 0) {
    await tx.insert(microdoseRevisionTags).values(
      tagRows.map((tag) => ({
        revisionId: revision.id,
        value: tag.value,
        labelMarkdown: tag.labelMarkdown,
      })),
    );
  }

  if (speakerRows.length > 0) {
    await tx.insert(microdoseRevisionSpeakers).values(
      speakerRows.map((speaker) => ({
        revisionId: revision.id,
        speakerId: speaker.speakerId,
      })),
    );
  }

  if (subjectRows.length > 0) {
    await tx.insert(microdoseRevisionSubjects).values(
      subjectRows.map((subject) => ({
        revisionId: revision.id,
        subjectId: subject.subjectId,
      })),
    );
  }

  if (segmentRows.length > 0) {
    await tx.insert(transcriptSegments).values(
      segmentRows.map((segment) => ({
        revisionId: revision.id,
        orderIndex: segment.orderIndex,
        startMs: segment.startMs,
        endMs: segment.endMs,
        text: segment.text,
        speakerId: segment.speakerId,
      })),
    );
  }

  return revision.id;
}

async function syncRevisionCollections(
  tx: RevisionWriter,
  revisionId: string,
  input: EditableMicrodoseInput,
) {
  if (input.tags.length > 0) {
    await tx.insert(microdoseRevisionTags).values(
      input.tags.map((tag) => ({
        revisionId,
        value: tag.value,
        labelMarkdown: tag.label,
      })),
    );
  }

  if (input.speakerIds.length > 0) {
    await tx.insert(microdoseRevisionSpeakers).values(
      input.speakerIds.map((speakerId) => ({
        revisionId,
        speakerId,
      })),
    );
  }

  if (input.subjectIds.length > 0) {
    await tx.insert(microdoseRevisionSubjects).values(
      input.subjectIds.map((subjectId) => ({
        revisionId,
        subjectId,
      })),
    );
  }

  if (input.transcript.length > 0) {
    await tx.insert(transcriptSegments).values(
      input.transcript.map((segment, index) => ({
        revisionId,
        orderIndex: index,
        startMs: Math.round(segment.start * 1000),
        endMs: Math.round(segment.end * 1000),
        text: segment.text,
        speakerId: segment.speakerId ?? null,
      })),
    );
  }
}

function toOptionalSpeaker(
  speaker:
    | {
        id: string;
        name: string;
      }
    | undefined,
) {
  if (!speaker) {
    return undefined;
  }

  return {
    id: speaker.id,
    name: speaker.name,
  };
}

function slugifyPersonName(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!slug) {
    throw new Error("Person name is required.");
  }

  return slug;
}
