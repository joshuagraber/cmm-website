import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentDir = path.join(root, "content", "microdoses");
const speakersPath = path.join(root, "content", "speakers.json");
const args = parseArgs(process.argv.slice(2));
const id = required("id");
const recordPath = path.join(contentDir, `${id}.json`);

if (!fs.existsSync(recordPath)) {
  fail(`No microdose record found at ${path.relative(root, recordPath)}.`);
}

const record = JSON.parse(fs.readFileSync(recordPath, "utf8"));
const speakers = readSpeakers();
const speakerIds = new Set(record.speakerIds ?? []);
const selectedSpeakers = speakers.filter((speaker) => speakerIds.has(speaker.id));

if (!Array.isArray(record.transcript) || record.transcript.length === 0) {
  fail("This microdose does not have transcript chunks yet.");
}

if (selectedSpeakers.length === 0) {
  fail("Add speakerIds to this microdose before assigning transcript speakers.");
}

const initialDefaultSpeakerId = args.get("default-speaker-id");
if (
  initialDefaultSpeakerId &&
  !selectedSpeakers.some((speaker) => speaker.id === initialDefaultSpeakerId)
) {
  fail(
    `--default-speaker-id "${initialDefaultSpeakerId}" must be listed in this microdose speakerIds.`,
  );
}

const rl = readline.createInterface({ input, output });
let lastSpeakerId =
  initialDefaultSpeakerId ??
  (selectedSpeakers.length === 1 ? selectedSpeakers[0].id : null);

try {
  for (let index = 0; index < record.transcript.length; index += 1) {
    const segment = record.transcript[index];
    const existingSpeaker = segment.speakerId
      ? selectedSpeakers.find((speaker) => speaker.id === segment.speakerId)
      : null;
    const defaultSpeakerId = existingSpeaker?.id ?? lastSpeakerId;

    console.log("");
    console.log(
      `${index + 1}/${record.transcript.length} ${formatTime(segment.start)}-${formatTime(segment.end)}`,
    );
    console.log(segment.text);
    console.log("");
    selectedSpeakers.forEach((speaker, speakerIndex) => {
      const current = speaker.id === defaultSpeakerId ? " [default]" : "";
      console.log(`${speakerIndex + 1}. ${speaker.name} (${speaker.id})${current}`);
    });

    const answer = (
      await rl.question(
        "Speaker number/id, enter for default, s to skip, q to save and quit: ",
      )
    ).trim();

    if (answer.toLowerCase() === "q") {
      break;
    }

    if (answer.toLowerCase() === "s") {
      continue;
    }

    const speaker = answer
      ? findSpeaker(answer, selectedSpeakers)
      : selectedSpeakers.find((item) => item.id === defaultSpeakerId);

    if (!speaker) {
      console.log(`No speaker found for "${answer}". Repeating this chunk.`);
      index -= 1;
      continue;
    }

    segment.speakerId = speaker.id;
    lastSpeakerId = speaker.id;
  }

  fs.writeFileSync(recordPath, `${JSON.stringify(record, null, 2)}\n`);
  console.log(`Updated ${path.relative(root, recordPath)}.`);
} finally {
  rl.close();
}

function parseArgs(argv) {
  const parsed = new Map();

  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];

    if (!key.startsWith("--")) {
      fail(`Unexpected argument: ${key}`);
    }

    const next = argv[index + 1];
    if (next === undefined || next.startsWith("--")) {
      parsed.set(key.slice(2), "true");
    } else {
      parsed.set(key.slice(2), next);
      index += 1;
    }
  }

  return parsed;
}

function required(name) {
  const value = args.get(name);

  if (!value) {
    fail("Usage: npm run microdoses:assign-speakers -- --id microdose-id");
  }

  return value;
}

function readSpeakers() {
  if (!fs.existsSync(speakersPath)) {
    fail("No content/speakers.json registry found.");
  }

  const speakers = JSON.parse(fs.readFileSync(speakersPath, "utf8"));
  if (!Array.isArray(speakers)) {
    fail("content/speakers.json must be an array.");
  }

  return speakers;
}

function findSpeaker(value, speakers) {
  const numericIndex = Number(value);
  if (Number.isInteger(numericIndex) && numericIndex > 0) {
    return speakers[numericIndex - 1];
  }

  return speakers.find((speaker) => speaker.id === value);
}

function formatTime(seconds) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
