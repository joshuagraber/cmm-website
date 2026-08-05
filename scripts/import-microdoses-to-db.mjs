import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";
import { fileURLToPath } from "node:url";
import { loadEnv } from "./load-env.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
loadEnv(root);

const contentDir = path.join(root, "content", "microdoses");
const speakersPath = path.join(root, "content", "speakers.json");
const subjectsPath = path.join(root, "content", "subjects.json");
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  fail("DATABASE_URL is required.");
}

const sql = postgres(databaseUrl, { max: 1 });

try {
  await importPeople();
  await importMicrodoses();
  console.log("Imported microdose seed content.");
} finally {
  await sql.end();
}

async function importPeople() {
  const speakers = JSON.parse(fs.readFileSync(speakersPath, "utf8"));
  const subjects = JSON.parse(fs.readFileSync(subjectsPath, "utf8"));

  for (const speaker of speakers) {
    await sql`
      INSERT INTO people (id, name, bio_markdown, updated_at)
      VALUES (${speaker.id}, ${speaker.name}, ${speaker.bio ?? ""}, now())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        bio_markdown = EXCLUDED.bio_markdown,
        updated_at = now()
    `;
  }

  for (const subject of subjects) {
    await sql`
      INSERT INTO people (id, name, bio_markdown, updated_at)
      VALUES (${subject.id}, ${subject.name}, ${subject.bio ?? ""}, now())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        bio_markdown = EXCLUDED.bio_markdown,
        updated_at = now()
    `;
  }
}

async function importMicrodoses() {
  const files = fs
    .readdirSync(contentDir)
    .filter((file) => file.endsWith(".json"))
    .sort();

  for (const file of files) {
    const record = JSON.parse(fs.readFileSync(path.join(contentDir, file), "utf8"));
    const src = record.media?.src ?? "";
    const [asset] = await sql`
      INSERT INTO audio_assets (
        s3_key,
        public_path,
        original_filename,
        mime_type,
        duration_seconds,
        upload_status,
        updated_at
      )
      VALUES (
        ${`seed/${record.id}/${path.basename(src)}`},
        ${src},
        ${path.basename(src)},
        ${record.media?.type === "audio" ? "audio/mpeg" : "application/octet-stream"},
        ${record.media?.durationSeconds ?? null},
        'complete',
        now()
      )
      ON CONFLICT (s3_key) DO UPDATE SET
        public_path = EXCLUDED.public_path,
        original_filename = EXCLUDED.original_filename,
        duration_seconds = EXCLUDED.duration_seconds,
        upload_status = 'complete',
        updated_at = now()
      RETURNING id
    `;
    const [microdose] = await sql`
      INSERT INTO microdoses (slug, archived, updated_at)
      VALUES (${record.id}, false, now())
      ON CONFLICT (slug) DO UPDATE SET archived = false, updated_at = now()
      RETURNING id
    `;
    const [revision] = await sql`
      INSERT INTO microdose_revisions (
        microdose_id,
        title,
        description_markdown,
        speaker_label,
        icon,
        audio_asset_id,
        updated_at
      )
      VALUES (
        ${microdose.id},
        ${record.title},
        ${record.description},
        ${record.speakerLabel},
        ${record.icon},
        ${asset.id},
        now()
      )
      RETURNING id
    `;

    await insertRevisionCollections(revision.id, record);
    await sql`
      UPDATE microdoses
      SET draft_revision_id = ${revision.id},
          published_revision_id = ${revision.id},
          updated_at = now()
      WHERE id = ${microdose.id}
    `;
    console.log(`Imported ${record.id}`);
  }
}

async function insertRevisionCollections(revisionId, record) {
  for (const tag of record.tags ?? []) {
    const normalized =
      typeof tag === "string" ? { value: tag, label: tag } : tag;
    await sql`
      INSERT INTO microdose_revision_tags (revision_id, value, label_markdown)
      VALUES (${revisionId}, ${normalized.value}, ${normalized.label})
    `;
  }

  for (const speakerId of record.speakerIds ?? []) {
    await sql`
      INSERT INTO microdose_revision_speakers (revision_id, speaker_id)
      VALUES (${revisionId}, ${speakerId})
      ON CONFLICT DO NOTHING
    `;
  }

  for (const subjectId of record.subjectIds ?? []) {
    await sql`
      INSERT INTO microdose_revision_subjects (revision_id, subject_id)
      VALUES (${revisionId}, ${subjectId})
      ON CONFLICT DO NOTHING
    `;
  }

  for (const [index, segment] of (record.transcript ?? []).entries()) {
    await sql`
      INSERT INTO transcript_segments (
        revision_id,
        order_index,
        start_ms,
        end_ms,
        text,
        speaker_id
      )
      VALUES (
        ${revisionId},
        ${index},
        ${Math.round(segment.start * 1000)},
        ${Math.round(segment.end * 1000)},
        ${segment.text},
        ${segment.speakerId ?? null}
      )
    `;
  }
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
