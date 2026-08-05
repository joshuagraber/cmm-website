import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const transcriptionJobStatus = pgEnum("transcription_job_status", [
  "queued",
  "running",
  "complete",
  "failed",
]);

export const audioAssets = pgTable("audio_assets", {
  id: uuid("id").defaultRandom().primaryKey(),
  s3Key: text("s3_key").notNull().unique(),
  publicPath: text("public_path"),
  originalFilename: text("original_filename").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes"),
  durationSeconds: integer("duration_seconds"),
  uploadStatus: text("upload_status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const people = pgTable("people", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  bioMarkdown: text("bio_markdown").notNull().default(""),
  links: jsonb("links").$type<Array<{ label: string; href: string }>>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const microdoses = pgTable("microdoses", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  archived: boolean("archived").notNull().default(false),
  draftRevisionId: uuid("draft_revision_id"),
  publishedRevisionId: uuid("published_revision_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const microdoseRevisions = pgTable(
  "microdose_revisions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    microdoseId: uuid("microdose_id")
      .notNull()
      .references(() => microdoses.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    descriptionMarkdown: text("description_markdown").notNull(),
    speakerLabel: text("speaker_label").notNull(),
    icon: text("icon").notNull(),
    audioAssetId: uuid("audio_asset_id").references(() => audioAssets.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("microdose_revisions_microdose_id_idx").on(table.microdoseId)],
);

export const microdoseRevisionTags = pgTable(
  "microdose_revision_tags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    revisionId: uuid("revision_id")
      .notNull()
      .references(() => microdoseRevisions.id, { onDelete: "cascade" }),
    value: text("value").notNull(),
    labelMarkdown: text("label_markdown").notNull(),
  },
  (table) => [index("microdose_revision_tags_revision_id_idx").on(table.revisionId)],
);

export const microdoseRevisionSpeakers = pgTable(
  "microdose_revision_speakers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    revisionId: uuid("revision_id")
      .notNull()
      .references(() => microdoseRevisions.id, { onDelete: "cascade" }),
    speakerId: text("speaker_id")
      .notNull()
      .references(() => people.id),
  },
  (table) => [
    index("microdose_revision_speakers_revision_id_idx").on(table.revisionId),
    uniqueIndex("microdose_revision_speakers_unique_idx").on(
      table.revisionId,
      table.speakerId,
    ),
  ],
);

export const microdoseRevisionSubjects = pgTable(
  "microdose_revision_subjects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    revisionId: uuid("revision_id")
      .notNull()
      .references(() => microdoseRevisions.id, { onDelete: "cascade" }),
    subjectId: text("subject_id")
      .notNull()
      .references(() => people.id),
  },
  (table) => [
    index("microdose_revision_subjects_revision_id_idx").on(table.revisionId),
    uniqueIndex("microdose_revision_subjects_unique_idx").on(
      table.revisionId,
      table.subjectId,
    ),
  ],
);

export const transcriptSegments = pgTable(
  "transcript_segments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    revisionId: uuid("revision_id")
      .notNull()
      .references(() => microdoseRevisions.id, { onDelete: "cascade" }),
    orderIndex: integer("order_index").notNull(),
    startMs: integer("start_ms").notNull(),
    endMs: integer("end_ms").notNull(),
    text: text("text").notNull(),
    speakerId: text("speaker_id").references(() => people.id),
  },
  (table) => [
    index("transcript_segments_revision_id_idx").on(table.revisionId),
    uniqueIndex("transcript_segments_order_idx").on(table.revisionId, table.orderIndex),
  ],
);

export const transcriptionJobs = pgTable(
  "transcription_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    audioAssetId: uuid("audio_asset_id")
      .notNull()
      .references(() => audioAssets.id),
    revisionId: uuid("revision_id")
      .notNull()
      .references(() => microdoseRevisions.id, { onDelete: "cascade" }),
    provider: text("provider").notNull().default("vercel-whisper"),
    status: transcriptionJobStatus("status").notNull().default("queued"),
    attempts: integer("attempts").notNull().default(0),
    error: text("error"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("transcription_jobs_status_idx").on(table.status)],
);
