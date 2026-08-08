import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const enabled = process.env.ENABLE_VERCEL_TRANSCRIPTION === "true";
const assetDir = path.join(root, "vercel-transcription");
const binDir = path.join(assetDir, "bin");
const modelDir = path.join(assetDir, "models");
const archivePath = path.join(assetDir, "whisper-cli-archive");
const whisperBinPath = path.join(binDir, "whisper-cli");
const ffmpegBinPath = path.join(binDir, "ffmpeg");
const modelName = process.env.VERCEL_WHISPER_MODEL_NAME ?? "tiny.en";
const modelFile = process.env.VERCEL_WHISPER_MODEL_FILE ?? `ggml-${modelName}.bin`;
const modelPath = path.join(modelDir, modelFile);

const whisperUrl =
  process.env.VERCEL_WHISPER_CPP_URL ??
  "https://github.com/ggml-org/whisper.cpp/releases/download/v1.9.1/whisper-bin-ubuntu-x64.tar.gz";
const modelUrl =
  process.env.VERCEL_WHISPER_MODEL_URL ??
  `https://huggingface.co/ggerganov/whisper.cpp/resolve/main/${modelFile}`;

if (!enabled) {
  console.log("Skipping Vercel transcription assets. Set ENABLE_VERCEL_TRANSCRIPTION=true to prepare them.");
  process.exit(0);
}

await fs.mkdir(binDir, { recursive: true });
await fs.mkdir(modelDir, { recursive: true });

if (!(await exists(whisperBinPath))) {
  await download(whisperUrl, archivePath);
  await extractWhisperCli(archivePath);
  await fs.chmod(whisperBinPath, 0o755);
} else {
  console.log(`Using existing ${path.relative(root, whisperBinPath)}`);
}

if (!(await exists(modelPath))) {
  await download(modelUrl, modelPath);
} else {
  console.log(`Using existing ${path.relative(root, modelPath)}`);
}

await copyFfmpeg();
await copyWhisperSharedLibraries();
await cleanupTemporaryAssets();

console.log("Vercel transcription assets ready:");
console.log(`WHISPER_CPP_BIN=${path.relative(root, whisperBinPath)}`);
console.log(`WHISPER_CPP_MODEL=${path.relative(root, modelPath)}`);
console.log(`FFMPEG_BIN=${path.relative(root, ffmpegBinPath)}`);
console.log(`Bundled binaries: ${(await fs.readdir(binDir)).sort().join(", ")}`);

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function download(url, outputPath) {
  console.log(`Downloading ${url}`);
  const response = await fetch(url);

  if (!response.ok || !response.body) {
    throw new Error(`Download failed for ${url}: ${response.status}`);
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await pipeline(Readable.fromWeb(response.body), createWriteStream(outputPath));
}

async function extractWhisperCli(inputPath) {
  const extractDir = path.join(assetDir, "extract");
  await fs.rm(extractDir, { recursive: true, force: true });
  await fs.mkdir(extractDir, { recursive: true });
  const archiveTool = whisperUrl.endsWith(".zip") ? "unzip" : "tar";
  const archiveArgs =
    archiveTool === "unzip"
      ? ["-o", inputPath, "-d", extractDir]
      : ["-xzf", inputPath, "-C", extractDir];
  const result = spawnSync(archiveTool, archiveArgs, {
    stdio: "inherit",
  });

  if (result.status !== 0) {
    throw new Error("Failed to extract downloaded whisper.cpp archive.");
  }

  const found = spawnSync("find", [extractDir, "-type", "f", "-name", "whisper-cli"], {
    encoding: "utf8",
  });
  const extractedBin = found.stdout.trim().split("\n").filter(Boolean)[0];

  if (!extractedBin) {
    throw new Error("Downloaded whisper.cpp archive did not contain whisper-cli.");
  }

  const move = spawnSync("cp", ["-R", `${path.dirname(extractedBin)}/.`, binDir], {
    stdio: "inherit",
  });

  if (move.status !== 0) {
    throw new Error("Failed to copy whisper.cpp assets into the transcription asset directory.");
  }

  await fs.rm(archivePath, { force: true });
  await fs.rm(extractDir, { recursive: true, force: true });
}

async function copyFfmpeg() {
  const ffmpegStaticPath = require("ffmpeg-static");

  if (!ffmpegStaticPath) {
    throw new Error("ffmpeg-static did not resolve to an executable path.");
  }

  await fs.copyFile(ffmpegStaticPath, ffmpegBinPath);
  await fs.chmod(ffmpegBinPath, 0o755);
}

async function copyWhisperSharedLibraries() {
  const requiredLibraries = await whisperSharedLibraries();

  for (const libraryName of requiredLibraries) {
    const sourcePath = await findSharedLibrary(libraryName);
    const outputPath = path.join(binDir, libraryName);

    if (!sourcePath) {
      throw new Error(
        `Could not find required shared library ${libraryName} for whisper-cli.`,
      );
    }

    await fs.copyFile(sourcePath, outputPath);
    await fs.chmod(outputPath, 0o755);
    console.log(
      `Copied ${libraryName} from ${sourcePath} to ${path.relative(root, outputPath)}`,
    );
  }
}

async function whisperSharedLibraries() {
  const ldd = spawnSync("ldd", [whisperBinPath], {
    encoding: "utf8",
  });

  if (ldd.status !== 0) {
    return ["libgomp.so.1"];
  }

  const output = `${ldd.stdout}\n${ldd.stderr}`;
  const libraries = new Set();

  for (const line of output.split("\n")) {
    const trimmedLine = line.trim();
    const match = trimmedLine.match(/^(libgomp\.so\.\d+)\s+=>/);

    if (match) {
      libraries.add(match[1]);
    }
  }

  return libraries.size > 0 ? Array.from(libraries) : ["libgomp.so.1"];
}

async function findSharedLibrary(libraryName) {
  const ldconfig = spawnSync("ldconfig", ["-p"], {
    encoding: "utf8",
  });

  if (ldconfig.status === 0) {
    for (const line of ldconfig.stdout.split("\n")) {
      if (!line.includes(libraryName)) {
        continue;
      }

      const match = line.match(/=>\s+(\S+)$/);

      if (match && (await exists(match[1]))) {
        return match[1];
      }
    }
  }

  for (const candidate of [
    `/lib64/${libraryName}`,
    `/usr/lib64/${libraryName}`,
    `/lib/x86_64-linux-gnu/${libraryName}`,
    `/usr/lib/x86_64-linux-gnu/${libraryName}`,
  ]) {
    if (await exists(candidate)) {
      return candidate;
    }
  }

  return null;
}

async function cleanupTemporaryAssets() {
  await fs.rm(archivePath, { force: true });
  await fs.rm(path.join(assetDir, "extract"), { recursive: true, force: true });
}
