import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import ffmpegStatic from "ffmpeg-static";
import type { TranscriptSegment } from "@/lib/microdoses";
import { downloadAudioObject } from "@/lib/storage";

export async function transcribeS3Audio(key: string): Promise<TranscriptSegment[]> {
  const whisperBin =
    envValue(process.env.WHISPER_CPP_BIN) ??
    ".vercel-transcription/bin/whisper-cli";
  const whisperModel =
    envValue(process.env.WHISPER_CPP_MODEL) ??
    ".vercel-transcription/models/ggml-tiny.en.bin";
  const ffmpegBin = envValue(process.env.FFMPEG_BIN) ?? ffmpegStatic ?? "ffmpeg";

  if (!whisperBin || !whisperModel) {
    throw new Error("WHISPER_CPP_BIN and WHISPER_CPP_MODEL are required.");
  }

  const resolvedWhisperBin = resolveRuntimePath(whisperBin);
  const resolvedWhisperModel = resolveRuntimePath(whisperModel);

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "cmm-transcribe-"));
  const inputPath = path.join(tempDir, "source-audio");
  const wavPath = path.join(tempDir, "source.wav");
  const outputBase = path.join(tempDir, "transcript");
  const outputJsonPath = `${outputBase}.json`;

  try {
    await fs.writeFile(inputPath, await downloadAudioObject(key));
    await run(ffmpegBin, [
      "-nostdin",
      "-y",
      "-i",
      inputPath,
      "-ar",
      "16000",
      "-ac",
      "1",
      "-c:a",
      "pcm_s16le",
      wavPath,
    ]);
    await run(resolvedWhisperBin, [
      "-m",
      resolvedWhisperModel,
      "-f",
      wavPath,
      "-oj",
      "-of",
      outputBase,
      "-ng",
    ]);

    const output = JSON.parse(await fs.readFile(outputJsonPath, "utf8"));

    return normalizeTranscript(output);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

function envValue(value: string | undefined) {
  return value?.trim() || undefined;
}

function resolveRuntimePath(value: string) {
  if (path.isAbsolute(value) || value.includes("/") || value.includes("\\")) {
    return path.isAbsolute(value)
      ? value
      : path.join(/* turbopackIgnore: true */ process.cwd(), value);
  }

  return value;
}

function run(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });

    child.on("error", (error) => {
      if ("code" in error && error.code === "ENOENT") {
        reject(
          new Error(
            `Command not found: ${command}. Set WHISPER_CPP_BIN or FFMPEG_BIN to an installed executable or file path.`,
          ),
        );
        return;
      }

      reject(error);
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed: ${command} ${args.join(" ")}`));
      }
    });
  });
}

function normalizeTranscript(output: unknown): TranscriptSegment[] {
  if (typeof output !== "object" || output === null) {
    return [];
  }

  const record = output as Record<string, unknown>;
  const sourceSegments =
    record.transcription ??
    record.segments ??
    record.transcript ??
    record.results ??
    [];

  if (!Array.isArray(sourceSegments)) {
    return [];
  }

  return sourceSegments
    .map((segment) => {
      if (typeof segment !== "object" || segment === null) {
        return null;
      }

      const item = segment as Record<string, unknown>;
      const text = String(item.text ?? "").trim();
      const start =
        toSeconds(item.start) ??
        toSeconds(item.start_time) ??
        toSeconds((item.timestamps as Record<string, unknown> | undefined)?.from);
      const end =
        toSeconds(item.end) ??
        toSeconds(item.end_time) ??
        toSeconds((item.timestamps as Record<string, unknown> | undefined)?.to);

      if (!text || start === null || end === null || end <= start) {
        return null;
      }

      return {
        start: roundSeconds(start),
        end: roundSeconds(end),
        text,
      };
    })
    .filter((segment): segment is TranscriptSegment => Boolean(segment));
}

function toSeconds(value: unknown): number | null {
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

function roundSeconds(value: number) {
  return Math.round(value * 100) / 100;
}
