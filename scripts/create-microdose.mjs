import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentDir = path.join(root, "content", "microdoses");
const speakersPath = path.join(root, "content", "speakers.json");
const args = parseArgs(process.argv.slice(2));
const rl = readline.createInterface({ input, output });
const supportedIcons = [
  "archive",
  "atom",
  "audio-lines",
  "beaker",
  "book-open",
  "brain",
  "cassette",
  "dna",
  "eye",
  "flask",
  "flower",
  "ghost",
  "headphones",
  "library",
  "mic",
  "molecule",
  "notebook",
  "octopus",
  "pill",
  "podcast",
  "quote",
  "radio",
  "scroll",
  "signal",
  "sparkles",
  "telescope",
  "test-tube",
  "waves",
  "zap",
];
const tabColorPairs = [
  {
    surface: "var(--acid-tab-surface-a)",
    icon: "var(--acid-tab-icon-a)",
  },
  {
    surface: "var(--acid-tab-surface-b)",
    icon: "var(--acid-tab-icon-b)",
  },
  {
    surface: "var(--acid-tab-surface-c)",
    icon: "var(--acid-tab-icon-c)",
  },
  {
    surface: "var(--acid-tab-surface-d)",
    icon: "var(--acid-tab-icon-d)",
  },
  {
    surface: "var(--acid-tab-surface-e)",
    icon: "var(--acid-tab-icon-e)",
  },
  {
    surface: "var(--acid-tab-surface-f)",
    icon: "var(--acid-tab-icon-f)",
  },
  {
    surface: "var(--acid-tab-surface-g)",
    icon: "var(--acid-tab-icon-g)",
  },
  {
    surface: "var(--acid-tab-surface-h)",
    icon: "var(--acid-tab-icon-h)",
  },
  {
    surface: "var(--acid-tab-surface-i)",
    icon: "var(--acid-tab-icon-i)",
  },
  {
    surface: "var(--acid-tab-surface-j)",
    icon: "var(--acid-tab-icon-j)",
  },
  {
    surface: "var(--acid-tab-surface-k)",
    icon: "var(--acid-tab-icon-k)",
  },
  {
    surface: "var(--acid-tab-surface-l)",
    icon: "var(--acid-tab-icon-l)",
  },
  {
    surface: "var(--acid-tab-surface-m)",
    icon: "var(--acid-tab-icon-m)",
  },
  {
    surface: "var(--acid-tab-surface-n)",
    icon: "var(--acid-tab-icon-n)",
  },
  {
    surface: "var(--acid-tab-surface-o)",
    icon: "var(--acid-tab-icon-o)",
  },
  {
    surface: "var(--acid-tab-surface-p)",
    icon: "var(--acid-tab-icon-p)",
  },
];

try {
  const id = await promptRequired("id", "Microdose id");
  const destination = path.join(contentDir, `${id}.json`);

  if (fs.existsSync(destination) && args.get("force") !== "true") {
    fail(
      [
        `Microdose ${id} already exists at ${path.relative(root, destination)}.`,
        "No changes were made.",
        "Pass --force true to overwrite the record.",
      ].join("\n"),
    );
  }

  const speakers = readSpeakers();
  const speakerIds = await resolveSpeakerIds(speakers);
  const derivedSpeakerLabel = speakerIds
    .map((speakerId) => speakers.find((speaker) => speaker.id === speakerId))
    .filter(Boolean)
    .map((speaker) => speaker.name)
    .join(" + ");
  const speakerLabel =
    (args.get("speaker-label") ?? derivedSpeakerLabel) || "CMM Archive";

  const record = {
    id,
    title: await promptRequired("title", "Title"),
    description:
      args.get("description") ??
      "Draft description. Replace this before publishing the microdose.",
    speakerLabel,
    speakerIds,
    icon: await resolveIcon(),
    tags: optionalList("tags"),
    media: {
      type: "audio",
      src: await promptRequired("audio", "Audio path under public"),
    },
    tabColorPairs,
    subjectIds: optionalList("subject-ids"),
    transcript: [],
  };

  fs.mkdirSync(contentDir, { recursive: true });
  fs.writeFileSync(destination, `${JSON.stringify(record, null, 2)}\n`);

  console.log(`Created ${path.relative(root, destination)}`);
  console.log("");
  console.log("Next steps:");
  console.log(
    `- npm run microdoses:transcribe -- --id ${id} --assign-speakers`,
  );
  console.log(
    `- npm run microdoses:assign-speakers -- --id ${id} to revisit speaker labels`,
  );
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

async function promptRequired(name, label) {
  const value = args.get(name) ?? (await rl.question(`${label}: `));

  if (!value?.trim()) {
    fail(`Missing required --${name} value.`);
  }

  return value.trim();
}

async function resolveIcon() {
  const promptedValue = args.has("icon")
    ? null
    : (
        await rl.question(
          `Icon id (${supportedIcons.join(", ")}). Default molecule: `,
        )
      ).trim();
  const value = (args.get("icon") ?? promptedValue) || "molecule";

  if (!supportedIcons.includes(value)) {
    fail(`Unsupported icon "${value}". Use one of: ${supportedIcons.join(", ")}`);
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

function readSpeakers() {
  if (!fs.existsSync(speakersPath)) {
    fs.writeFileSync(speakersPath, "[]\n");
  }

  const speakers = JSON.parse(fs.readFileSync(speakersPath, "utf8"));

  if (!Array.isArray(speakers)) {
    fail("content/speakers.json must be an array.");
  }

  return speakers;
}

async function resolveSpeakerIds(speakers) {
  const explicitIds = optionalList("speaker-ids");
  if (explicitIds.length > 0) {
    assertSpeakerIdsExist(explicitIds, speakers);
    return explicitIds;
  }

  const selectedIds = new Set();

  while (true) {
    console.log("");
    console.log("Speakers:");
    if (speakers.length === 0) {
      console.log("- No speakers yet.");
    } else {
      speakers.forEach((speaker, index) => {
        console.log(`${index + 1}. ${speaker.name} (${speaker.id})`);
      });
    }

    const answer = (
      await rl.question(
        "Add an existing speaker number/id, type + to add a speaker, or press enter when done: ",
      )
    ).trim();

    if (!answer) {
      break;
    }

    if (answer === "+") {
      const speaker = await addSpeaker(speakers);
      selectedIds.add(speaker.id);
      continue;
    }

    const speaker = findSpeaker(answer, speakers);
    if (!speaker) {
      console.log(`No speaker found for "${answer}".`);
      continue;
    }

    selectedIds.add(speaker.id);
  }

  return Array.from(selectedIds);
}

async function addSpeaker(speakers) {
  const name = (await rl.question("Speaker name: ")).trim();
  const id = slugify(name);

  if (!name) {
    console.log("Speaker name is required.");
    return addSpeaker(speakers);
  }

  if (speakers.some((speaker) => speaker.id === id)) {
    console.log(`Speaker "${id}" already exists.`);
    return addSpeaker(speakers);
  }

  const speaker = { id, name };
  speakers.push(speaker);
  speakers.sort((a, b) => a.id.localeCompare(b.id));
  fs.writeFileSync(speakersPath, `${JSON.stringify(speakers, null, 2)}\n`);
  console.log(`Added ${name} (${id}).`);

  return speaker;
}

function findSpeaker(value, speakers) {
  const numericIndex = Number(value);
  if (Number.isInteger(numericIndex) && numericIndex > 0) {
    return speakers[numericIndex - 1];
  }

  return speakers.find((speaker) => speaker.id === value);
}

function assertSpeakerIdsExist(speakerIds, speakers) {
  const knownSpeakerIds = new Set(speakers.map((speaker) => speaker.id));
  const missing = speakerIds.filter((speakerId) => !knownSpeakerIds.has(speakerId));

  if (missing.length > 0) {
    fail(`Unknown speaker id(s): ${missing.join(", ")}`);
  }
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
