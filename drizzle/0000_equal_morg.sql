CREATE TYPE "public"."transcription_job_status" AS ENUM('queued', 'running', 'complete', 'failed');--> statement-breakpoint
CREATE TABLE "audio_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"s3_key" text NOT NULL,
	"public_path" text,
	"original_filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer,
	"duration_seconds" integer,
	"upload_status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "audio_assets_s3_key_unique" UNIQUE("s3_key")
);
--> statement-breakpoint
CREATE TABLE "microdose_revision_speakers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"revision_id" uuid NOT NULL,
	"speaker_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "microdose_revision_subjects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"revision_id" uuid NOT NULL,
	"subject_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "microdose_revision_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"revision_id" uuid NOT NULL,
	"value" text NOT NULL,
	"label_markdown" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "microdose_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"microdose_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description_markdown" text NOT NULL,
	"speaker_label" text NOT NULL,
	"icon" text NOT NULL,
	"audio_asset_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "microdoses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"draft_revision_id" uuid,
	"published_revision_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "microdoses_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "speakers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"role" text,
	"bio_markdown" text DEFAULT '' NOT NULL,
	"links" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"role" text,
	"bio_markdown" text DEFAULT '' NOT NULL,
	"links" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transcript_segments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"revision_id" uuid NOT NULL,
	"order_index" integer NOT NULL,
	"start_ms" integer NOT NULL,
	"end_ms" integer NOT NULL,
	"text" text NOT NULL,
	"speaker_id" text
);
--> statement-breakpoint
CREATE TABLE "transcription_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"audio_asset_id" uuid NOT NULL,
	"revision_id" uuid NOT NULL,
	"provider" text DEFAULT 'vercel-whisper' NOT NULL,
	"status" "transcription_job_status" DEFAULT 'queued' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"error" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "microdose_revision_speakers" ADD CONSTRAINT "microdose_revision_speakers_revision_id_microdose_revisions_id_fk" FOREIGN KEY ("revision_id") REFERENCES "public"."microdose_revisions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "microdose_revision_speakers" ADD CONSTRAINT "microdose_revision_speakers_speaker_id_speakers_id_fk" FOREIGN KEY ("speaker_id") REFERENCES "public"."speakers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "microdose_revision_subjects" ADD CONSTRAINT "microdose_revision_subjects_revision_id_microdose_revisions_id_fk" FOREIGN KEY ("revision_id") REFERENCES "public"."microdose_revisions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "microdose_revision_subjects" ADD CONSTRAINT "microdose_revision_subjects_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "microdose_revision_tags" ADD CONSTRAINT "microdose_revision_tags_revision_id_microdose_revisions_id_fk" FOREIGN KEY ("revision_id") REFERENCES "public"."microdose_revisions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "microdose_revisions" ADD CONSTRAINT "microdose_revisions_microdose_id_microdoses_id_fk" FOREIGN KEY ("microdose_id") REFERENCES "public"."microdoses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "microdose_revisions" ADD CONSTRAINT "microdose_revisions_audio_asset_id_audio_assets_id_fk" FOREIGN KEY ("audio_asset_id") REFERENCES "public"."audio_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transcript_segments" ADD CONSTRAINT "transcript_segments_revision_id_microdose_revisions_id_fk" FOREIGN KEY ("revision_id") REFERENCES "public"."microdose_revisions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transcript_segments" ADD CONSTRAINT "transcript_segments_speaker_id_speakers_id_fk" FOREIGN KEY ("speaker_id") REFERENCES "public"."speakers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transcription_jobs" ADD CONSTRAINT "transcription_jobs_audio_asset_id_audio_assets_id_fk" FOREIGN KEY ("audio_asset_id") REFERENCES "public"."audio_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transcription_jobs" ADD CONSTRAINT "transcription_jobs_revision_id_microdose_revisions_id_fk" FOREIGN KEY ("revision_id") REFERENCES "public"."microdose_revisions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "microdose_revision_speakers_revision_id_idx" ON "microdose_revision_speakers" USING btree ("revision_id");--> statement-breakpoint
CREATE UNIQUE INDEX "microdose_revision_speakers_unique_idx" ON "microdose_revision_speakers" USING btree ("revision_id","speaker_id");--> statement-breakpoint
CREATE INDEX "microdose_revision_subjects_revision_id_idx" ON "microdose_revision_subjects" USING btree ("revision_id");--> statement-breakpoint
CREATE UNIQUE INDEX "microdose_revision_subjects_unique_idx" ON "microdose_revision_subjects" USING btree ("revision_id","subject_id");--> statement-breakpoint
CREATE INDEX "microdose_revision_tags_revision_id_idx" ON "microdose_revision_tags" USING btree ("revision_id");--> statement-breakpoint
CREATE INDEX "microdose_revisions_microdose_id_idx" ON "microdose_revisions" USING btree ("microdose_id");--> statement-breakpoint
CREATE INDEX "transcript_segments_revision_id_idx" ON "transcript_segments" USING btree ("revision_id");--> statement-breakpoint
CREATE UNIQUE INDEX "transcript_segments_order_idx" ON "transcript_segments" USING btree ("revision_id","order_index");--> statement-breakpoint
CREATE INDEX "transcription_jobs_status_idx" ON "transcription_jobs" USING btree ("status");