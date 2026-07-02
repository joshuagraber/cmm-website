"use client";

import Link from "next/link";
import { Pause, Play } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import type { Microdose } from "@/lib/microdoses";
import { cn } from "@/lib/utils";

type AudioMicrodoseExperienceProps = {
  microdose: Microdose;
};

const experiencedStorageKey = "cmm.microdoses.experienced";
const waveformColorTokens = [
  "--microdose-waveform-wave-a",
  "--microdose-waveform-wave-b",
  "--microdose-waveform-wave-c",
  "--microdose-waveform-wave-d",
];

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function markExperienced(id: string) {
  try {
    const storedValue = window.localStorage.getItem(experiencedStorageKey);
    const parsedValue = storedValue ? JSON.parse(storedValue) : [];
    const ids = new Set(
      Array.isArray(parsedValue)
        ? parsedValue.filter((value) => typeof value === "string")
        : [],
    );

    ids.add(id);
    window.localStorage.setItem(
      experiencedStorageKey,
      JSON.stringify(Array.from(ids)),
    );
  } catch {
    // Playback should not fail if storage is unavailable.
  }
}

function getWaveformThemeColors() {
  const styles = window.getComputedStyle(document.documentElement);

  return {
    progressColor: styles
      .getPropertyValue("--microdose-waveform-progress")
      .trim(),
    cursorColor: styles.getPropertyValue("--microdose-waveform-cursor").trim(),
    waveColors: waveformColorTokens.map((token) =>
      styles.getPropertyValue(token).trim(),
    ),
  };
}

export function AudioMicrodoseExperience({
  microdose,
}: AudioMicrodoseExperienceProps) {
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const transcriptContainerRef = useRef<HTMLDivElement | null>(null);
  const activeTranscriptRef = useRef<HTMLButtonElement | null>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(
    microdose.media.durationSeconds ?? 0,
  );

  const activeSegmentIndex = useMemo(
    () =>
      microdose.transcript.findIndex(
        (segment) => currentTime >= segment.start && currentTime < segment.end,
      ),
    [currentTime, microdose.transcript],
  );

  useEffect(() => {
    const container = waveformRef.current;

    if (!container) {
      return;
    }

    const { progressColor, cursorColor, waveColors } =
      getWaveformThemeColors();

    const wavesurfer = WaveSurfer.create({
      container,
      url: microdose.media.src,
      height: 164,
      barWidth: 3,
      barGap: 2,
      barRadius: 0,
      cursorColor: cursorColor,
      cursorWidth: 4,
      waveColor: waveColors,
      progressColor: progressColor,
      normalize: true,
    });

    wavesurferRef.current = wavesurfer;
    const colorSchemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const syncWaveformThemeColors = () => {
      const themeColors = getWaveformThemeColors();

      wavesurfer.setOptions({
        cursorColor: themeColors.cursorColor,
        progressColor: themeColors.progressColor,
        waveColor: themeColors.waveColors,
      });
    };

    const unsubscribers = [
      wavesurfer.on("ready", () => {
        setReady(true);
        setDuration(wavesurfer.getDuration());
      }),
      wavesurfer.on("play", () => {
        setPlaying(true);
        markExperienced(microdose.id);
      }),
      wavesurfer.on("pause", () => setPlaying(false)),
      wavesurfer.on("finish", () => setPlaying(false)),
      wavesurfer.on("timeupdate", (time) => setCurrentTime(time)),
      wavesurfer.on("interaction", () => {
        setCurrentTime(wavesurfer.getCurrentTime());
      }),
    ];
    colorSchemeQuery.addEventListener("change", syncWaveformThemeColors);

    return () => {
      colorSchemeQuery.removeEventListener("change", syncWaveformThemeColors);
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      wavesurfer.destroy();
      wavesurferRef.current = null;
    };
  }, [microdose.id, microdose.media.src]);

  useEffect(() => {
    const container = transcriptContainerRef.current;
    const activeTranscript = activeTranscriptRef.current;

    if (!container || !activeTranscript) {
      return;
    }

    const targetTop =
      activeTranscript.offsetTop -
      container.offsetTop -
      container.clientHeight / 2 +
      activeTranscript.clientHeight / 2;

    container.scrollTo({
      top: Math.max(targetTop, 0),
      behavior: "smooth",
    });
  }, [activeSegmentIndex]);

  function togglePlayback() {
    wavesurferRef.current?.playPause();
  }

  function seekTo(seconds: number) {
    const wavesurfer = wavesurferRef.current;

    if (!wavesurfer) {
      return;
    }

    const audioDuration = wavesurfer.getDuration();
    if (audioDuration > 0) {
      wavesurfer.seekTo(seconds / audioDuration);
    }
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.9fr)]">
      <section className="border-[10px] border-foreground bg-[var(--microdose-player-surface)] p-5 md:p-8">
        <div
          ref={waveformRef}
          className="min-h-[164px] border-4 border-foreground shadow-[inset_0_0_0_1px_var(--microdose-waveform-sheen)]"
          style={{
            background:
              "linear-gradient(180deg, var(--microdose-waveform-sheen), transparent 42%), var(--microdose-waveform-stage)",
          }}
          aria-label={`Waveform player for ${microdose.title}`}
        />
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={togglePlayback}
            disabled={!ready}
            className="inline-flex h-12 items-center gap-2 rounded-[var(--radius-button)] border-2 border-primary bg-primary px-5 text-sm font-black uppercase tracking-[0.08em] text-primary-foreground transition-colors hover:bg-cmm-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
          >
            {playing ? (
              <Pause aria-hidden="true" className="size-4" strokeWidth={3} />
            ) : (
              <Play aria-hidden="true" className="size-4 fill-current" strokeWidth={3} />
            )}
            {playing ? "Pause" : "Play"}
          </button>
          <div className="font-mono text-sm font-bold uppercase">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
      </section>

      <aside className="border-[10px] border-foreground bg-microdose-detail-surface p-5 md:p-8">
        <h2 className="font-serif text-4xl font-black leading-none">
          Transcript
        </h2>
        <div
          ref={transcriptContainerRef}
          className="mt-6 max-h-[34rem] overflow-y-auto pr-2"
        >
          {microdose.transcript.map((segment, index) => {
            const active = index === activeSegmentIndex;

            return (
              <button
                key={`${segment.start}-${segment.text}`}
                ref={active ? activeTranscriptRef : null}
                type="button"
                onClick={() => seekTo(segment.start)}
                className={cn(
                  "mb-3 block w-full border-2 border-foreground bg-microdose-detail-chip p-4 text-left transition-colors",
                  active &&
                    "border-microdose-transcript-active-border bg-microdose-transcript-active-bg text-microdose-transcript-active-fg shadow-[inset_0.35rem_0_0_var(--microdose-transcript-active-border)]",
                )}
              >
                <span className="mb-2 block font-mono text-xs font-bold uppercase">
                  {formatTime(segment.start)}
                </span>
                <span className="text-lg leading-snug">{segment.text}</span>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="lg:col-span-2">
        <h2 className="font-serif text-5xl font-black leading-none">
          Subjects
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {microdose.subjects.map((subject) => (
            <article
              key={subject.name}
              className="border-[6px] border-foreground bg-microdose-detail-surface p-5"
            >
              <h3 className="font-serif text-3xl font-black leading-tight">
                {subject.name}
              </h3>
              {subject.role ? (
                <p className="mt-1 font-bold uppercase tracking-[0.12em]">
                  {subject.role}
                </p>
              ) : null}
              <p className="mt-4 text-lg leading-relaxed">{subject.bio}</p>
            </article>
          ))}
        </div>
      </section>

      {microdose.tags.length > 0 ? (
        <section className="lg:col-span-2">
          <h2 className="font-serif text-5xl font-black leading-none">Tags</h2>
          <div className="mt-6 flex flex-wrap gap-3">
            {microdose.tags.map((tag) => (
              <Link
                key={tag}
                href={`/microdoses?tags=${encodeURIComponent(tag)}`}
                className="border-2 border-foreground bg-microdose-detail-chip px-4 py-3 font-bold uppercase underline decoration-2 underline-offset-4 transition-colors hover:bg-cmm-yellow"
              >
                {tag}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
