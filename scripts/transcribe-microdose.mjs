import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentDir = path.join(root, "content", "microdoses");
const defaultWhisperDir = path.join(root, "vendor", "whisper.cpp");
const defaultWhisperBin = path.join(
  defaultWhisperDir,
  "build",
  "bin",
  "whisper-cli",
);
const defaultModelCandidates = [
  path.join(root, "vendor", "whisper-models", "ggml-base.en.bin"),
  path.join(defaultWhisperDir, "models", "ggml-base.en.bin"),
];

const args = parseArgs(process.argv.slice(2));
const id = required("id");
const recordPath = path.join(contentDir, `${id}.json`);

if (!fs.existsSync(recordPath)) {
  fail(`No microdose record found at ${path.relative(root, recordPath)}.`);
}

const record = JSON.parse(fs.readFileSync(recordPath, "utf8"));
const audioPath = resolveAudioPath(args.get("audio") ?? record.media?.src);
const whisperBin = resolveExecutable(
  args.get("bin") ?? process.env.WHISPER_CPP_BIN,
);
const modelPath = resolveModelPath(
  args.get("model") ?? process.env.WHISPER_CPP_MODEL,
);

if (!fs.existsSync(modelPath)) {
  fail(
    [
      `Whisper model not found at ${path.relative(root, modelPath)}.`,
      "Run `npm run microdoses:setup-whisper` or pass `--model /path/to/ggml-model.bin`.",
    ].join("\n"),
  );
}

const ffmpegBin = resolveCommand(args.get("ffmpeg") ?? "ffmpeg");
if (!ffmpegBin) {
  fail("ffmpeg is required to normalize audio before whisper.cpp transcription.");
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cmm-whisper-"));
const wavPath = path.join(tempDir, `${id}.wav`);
const outputBase = path.join(tempDir, id);
const outputJsonPath = `${outputBase}.json`;

try {
  run(ffmpegBin, [
    "-nostdin",
    "-y",
    "-i",
    audioPath,
    "-ar",
    "16000",
    "-ac",
    "1",
    "-c:a",
    "pcm_s16le",
    wavPath,
  ]);

  const whisperArgs = [
    "-m",
    modelPath,
    "-f",
    wavPath,
    "-oj",
    "-of",
    outputBase,
  ];

  if (args.get("gpu") !== "true") {
    whisperArgs.push("-ng");
  }

  const language = args.get("language");
  if (language) {
    whisperArgs.push("-l", language);
  }

  if (args.get("word-timestamps") === "true") {
    whisperArgs.push("-ml", "1");
  }

  run(whisperBin, whisperArgs);

  if (!fs.existsSync(outputJsonPath)) {
    fail(`whisper.cpp did not create ${outputJsonPath}.`);
  }

  const whisperOutput = JSON.parse(fs.readFileSync(outputJsonPath, "utf8"));
  const transcript = normalizeTranscript(whisperOutput);

  if (transcript.length === 0) {
    fail("whisper.cpp returned no transcript segments.");
  }

  if (args.get("dry-run") === "true") {
    console.log(JSON.stringify(transcript, null, 2));
  } else {
    record.transcript = transcript;
    record.media = {
      ...record.media,
      durationSeconds: Math.ceil(transcript.at(-1).end),
    };

    fs.writeFileSync(recordPath, `${JSON.stringify(record, null, 2)}\n`);
    console.log(
      `Updated ${path.relative(root, recordPath)} with ${transcript.length} transcript segments.`,
    );
  }
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
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
    fail(
      'Usage: npm run microdoses:transcribe -- --id sizzle-reel-v2 [--model vendor/whisper.cpp/models/ggml-base.en.bin]',
    );
  }

  return value;
}

function resolveAudioPath(src) {
  if (!src || typeof src !== "string") {
    fail("Pass --audio or set media.src in the microdose record.");
  }

  const candidate = src.startsWith("/")
    ? path.join(root, "public", src)
    : path.resolve(root, src);

  if (!fs.existsSync(candidate)) {
    fail(`Audio file not found at ${path.relative(root, candidate)}.`);
  }

  return candidate;
}

function resolveExecutable(value) {
  if (value) {
    const directPath = path.resolve(root, value);
    if (fs.existsSync(directPath)) {
      return directPath;
    }

    const commandPath = resolveCommand(value);
    if (commandPath) {
      return commandPath;
    }

    fail(`Whisper binary not found: ${value}`);
  }

  if (fs.existsSync(defaultWhisperBin)) {
    return defaultWhisperBin;
  }

  for (const command of ["whisper-cli", "whisper-cpp", "whisper"]) {
    const commandPath = resolveCommand(command);
    if (commandPath) {
      return commandPath;
    }
  }

  fail(
    [
      "No whisper.cpp binary found.",
      "Run `npm run microdoses:setup-whisper` or pass `--bin /path/to/whisper-cli`.",
    ].join("\n"),
  );
}

function resolveModelPath(value) {
  if (value) {
    return path.resolve(root, value);
  }

  return (
    defaultModelCandidates.find((candidate) => fs.existsSync(candidate)) ??
    defaultModelCandidates[0]
  );
}

function resolveCommand(command) {
  const pathEntries = (process.env.PATH ?? "").split(path.delimiter);

  for (const entry of pathEntries) {
    const candidate = path.join(entry, command);

    try {
      fs.accessSync(candidate, fs.constants.X_OK);
      return candidate;
    } catch {
      // Keep scanning PATH.
    }
  }

  return null;
}

function run(command, commandArgs) {
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    fail(`Command failed: ${command} ${commandArgs.join(" ")}`);
  }
}

function normalizeTranscript(output) {
  const sourceSegments =
    output.transcription ??
    output.segments ??
    output.transcript ??
    output.results ??
    [];

  if (!Array.isArray(sourceSegments)) {
    return [];
  }

  return sourceSegments
    .map((segment) => {
      const text = String(segment.text ?? "").trim();
      const start =
        toSeconds(segment.start) ??
        toSeconds(segment.start_time) ??
        toSeconds(segment.timestamps?.from) ??
        toSeconds(segment.offsets?.from);
      const end =
        toSeconds(segment.end) ??
        toSeconds(segment.end_time) ??
        toSeconds(segment.timestamps?.to) ??
        toSeconds(segment.offsets?.to);

      if (!text || start === null || end === null || end <= start) {
        return null;
      }

      return {
        start: roundSeconds(start),
        end: roundSeconds(end),
        text,
      };
    })
    .filter(Boolean);
}

function toSeconds(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 1000 ? value / 1000 : value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const timestamp = value.trim().replace(",", ".");
  const parts = timestamp.split(":").map(Number);

  if (parts.some((part) => Number.isNaN(part))) {
    const numeric = Number(timestamp);
    return Number.isFinite(numeric) ? toSeconds(numeric) : null;
  }

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  return parts[0];
}

function roundSeconds(value) {
  return Math.round(value * 100) / 100;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
