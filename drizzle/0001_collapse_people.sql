CREATE TABLE "people" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"bio_markdown" text DEFAULT '' NOT NULL,
	"links" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "people" ("id", "name", "bio_markdown", "links", "created_at", "updated_at")
SELECT "id", "name", "bio_markdown", "links", "created_at", "updated_at"
FROM "speakers"
ON CONFLICT ("id") DO UPDATE SET
	"name" = EXCLUDED."name",
	"bio_markdown" = CASE
		WHEN "people"."bio_markdown" = '' THEN EXCLUDED."bio_markdown"
		ELSE "people"."bio_markdown"
	END,
	"links" = CASE
		WHEN "people"."links" = '[]'::jsonb THEN EXCLUDED."links"
		ELSE "people"."links"
	END,
	"updated_at" = now();
--> statement-breakpoint
INSERT INTO "people" ("id", "name", "bio_markdown", "links", "created_at", "updated_at")
SELECT "id", "name", "bio_markdown", "links", "created_at", "updated_at"
FROM "subjects"
ON CONFLICT ("id") DO UPDATE SET
	"name" = EXCLUDED."name",
	"bio_markdown" = CASE
		WHEN "people"."bio_markdown" = '' THEN EXCLUDED."bio_markdown"
		ELSE "people"."bio_markdown"
	END,
	"links" = CASE
		WHEN "people"."links" = '[]'::jsonb THEN EXCLUDED."links"
		ELSE "people"."links"
	END,
	"updated_at" = now();
--> statement-breakpoint
ALTER TABLE "microdose_revision_speakers" DROP CONSTRAINT IF EXISTS "microdose_revision_speakers_speaker_id_speakers_id_fk";
--> statement-breakpoint
ALTER TABLE "microdose_revision_subjects" DROP CONSTRAINT IF EXISTS "microdose_revision_subjects_subject_id_subjects_id_fk";
--> statement-breakpoint
ALTER TABLE "transcript_segments" DROP CONSTRAINT IF EXISTS "transcript_segments_speaker_id_speakers_id_fk";
--> statement-breakpoint
ALTER TABLE "microdose_revision_speakers" ADD CONSTRAINT "microdose_revision_speakers_speaker_id_people_id_fk" FOREIGN KEY ("speaker_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "microdose_revision_subjects" ADD CONSTRAINT "microdose_revision_subjects_subject_id_people_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "transcript_segments" ADD CONSTRAINT "transcript_segments_speaker_id_people_id_fk" FOREIGN KEY ("speaker_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
DROP TABLE "speakers";
--> statement-breakpoint
DROP TABLE "subjects";
