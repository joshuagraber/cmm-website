import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentDir = path.join(root, "content", "microdoses");

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  const key = process.argv[index];
  const value = process.argv[index + 1];

  if (!key?.startsWith("--") || value === undefined) {
    throw new Error(
      'Usage: npm run microdoses:create -- --id my-id --title "Title" --audio /audio/file.mp3',
    );
  }

  args.set(key.slice(2), value);
}

function required(name) {
  const value = args.get(name);

  if (!value) {
    throw new Error(`Missing required --${name} value.`);
  }

  return value;
}

function optionalList(name) {
  const value = args.get(name);

  return value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}

const id = required("id");
const destination = path.join(contentDir, `${id}.json`);

if (fs.existsSync(destination) && args.get("force") !== "true") {
  throw new Error(
    `Microdose ${id} already exists. Pass --force true to overwrite it.`,
  );
}

const record = {
  id,
  title: required("title"),
  description:
    args.get("description") ??
    "Draft description. Replace this before publishing the microdose.",
  speakerLabel: args.get("speaker") ?? "CMM Archive",
  icon: args.get("icon") ?? "ghost",
  tags: optionalList("tags"),
  media: {
    type: "audio",
    src: required("audio"),
  },
  tabColorPairs: [
    {
      surface: "var(--acid-tab-surface-a)",
      icon: "var(--brand-accent-cool)",
    },
  ],
  subjectIds: optionalList("subject-ids"),
  transcript: [
    {
      start: 0,
      end: 10,
      text:
        args.get("transcript-placeholder") ??
        "Transcript placeholder. Run the local transcription step and replace this segment.",
    },
  ],
};

fs.mkdirSync(contentDir, { recursive: true });
fs.writeFileSync(destination, `${JSON.stringify(record, null, 2)}\n`);

console.log(`Created ${path.relative(root, destination)}`);
console.log("");
console.log("Local transcription options that do not require an external API:");
console.log(
  "- whisper.cpp: recommended default; offline, fast on Apple Silicon, CLI-friendly.",
);
console.log(
  "- faster-whisper: Python/CTranslate2 option; strong throughput, heavier setup.",
);
console.log("");
console.log(
  "Next step: generate word or segment timestamps with one of those tools and paste normalized segments into transcript[].",
);
