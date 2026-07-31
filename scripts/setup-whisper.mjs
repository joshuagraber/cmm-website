import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceWhisperDir = path.join(root, "vendor", "whisper.cpp");
const modelDir = path.join(root, "vendor", "whisper-models");
const args = parseArgs(process.argv.slice(2));
const model = args.get("model") ?? "base.en";
const modelFile = `ggml-${model}.bin`;
const modelPath = path.join(modelDir, modelFile);
const forceSource = args.get("source") === "true";

if (process.platform === "darwin" && !forceSource && resolveCommand("brew")) {
  setupWithHomebrew();
} else {
  setupFromSource();
}

console.log("");
console.log("whisper.cpp is ready.");
console.log(
  `Try: npm run microdoses:transcribe -- --id gul-dolen-meeting-alex-shulgin --model ${path.relative(root, modelPath)}`,
);

function setupWithHomebrew() {
  run("brew", ["install", "whisper-cpp"], {
    skipIf: Boolean(resolveCommand("whisper-cli") ?? resolveCommand("whisper")),
    skipMessage: "Using existing Homebrew whisper.cpp binary",
  });
  downloadModel();
}

function setupFromSource() {
  if (!resolveCommand("cmake")) {
    fail(
      "cmake is required for source setup. Install cmake, or on macOS run without `--source true` to use Homebrew.",
    );
  }

  run("git", [
    "clone",
    "--depth",
    "1",
    "https://github.com/ggml-org/whisper.cpp.git",
    sourceWhisperDir,
  ], {
    skipIf: fs.existsSync(sourceWhisperDir),
    skipMessage: `Using existing ${path.relative(root, sourceWhisperDir)}`,
  });

  run("cmake", ["-B", "build"], { cwd: sourceWhisperDir });
  run("cmake", ["--build", "build", "-j", "--config", "Release"], {
    cwd: sourceWhisperDir,
  });
  run("sh", ["./models/download-ggml-model.sh", model], {
    cwd: sourceWhisperDir,
  });
}

function downloadModel() {
  fs.mkdirSync(modelDir, { recursive: true });

  run("curl", [
    "-L",
    "--fail",
    "--output",
    modelPath,
    `https://huggingface.co/ggerganov/whisper.cpp/resolve/main/${modelFile}`,
  ], {
    skipIf: fs.existsSync(modelPath),
    skipMessage: `Using existing ${path.relative(root, modelPath)}`,
  });
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

function run(command, commandArgs, options = {}) {
  if (options.skipIf) {
    console.log(options.skipMessage);
    return;
  }

  const result = spawnSync(command, commandArgs, {
    cwd: options.cwd ?? root,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    fail(`Command failed: ${command} ${commandArgs.join(" ")}`);
  }
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
