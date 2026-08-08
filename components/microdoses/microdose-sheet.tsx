"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { MicrodoseIconMark } from "@/components/microdoses/microdose-icons";
import type { Microdose, MicrodoseTabColorPair } from "@/lib/microdoses";
import { cn } from "@/lib/utils";

export type MicrodoseSheetItem = Microdose & {
  sheetId?: string;
  href?: string;
  tabColorPair?: MicrodoseTabColorPair;
};

type MicrodoseSheetProps = {
  microdoses: MicrodoseSheetItem[];
  activeTag?: string;
};

const pageSize = 10;
const experiencedStorageKey = "cmm.microdoses.experienced";
const fallbackTabColorPair = {
  surface: "var(--acid-tab-surface-a)",
  icon: "var(--brand-accent-warm)",
};

function hashId(id: string) {
  let hash = 0;

  for (let index = 0; index < id.length; index += 1) {
    hash = (hash << 5) - hash + id.charCodeAt(index);
    hash |= 0;
  }

  return hash;
}

function shuffleMicrodoses(microdoses: MicrodoseSheetItem[]) {
  const shuffled = [...microdoses];

  return shuffled.sort(
    (first, second) =>
      hashId(first.sheetId ?? first.id) - hashId(second.sheetId ?? second.id),
  );
}

function pickTabColorPair(microdose: MicrodoseSheetItem, index: number) {
  if (microdose.tabColorPair) {
    return microdose.tabColorPair;
  }

  const pairs = microdose.tabColorPairs;

  if (pairs.length === 0) {
    return fallbackTabColorPair;
  }

  return pairs[Math.abs(hashId(`${microdose.sheetId ?? microdose.id}:${index}`)) % pairs.length];
}

function readExperiencedIds() {
  try {
    const storedValue = window.localStorage.getItem(experiencedStorageKey);
    const parsedValue = storedValue ? JSON.parse(storedValue) : [];

    return Array.isArray(parsedValue)
      ? new Set(parsedValue.filter((value) => typeof value === "string"))
      : new Set<string>();
  } catch {
    return new Set<string>();
  }
}

export function MicrodoseSheet({ microdoses, activeTag }: MicrodoseSheetProps) {
  const items = useMemo(
    () =>
      microdoses.length > pageSize ? shuffleMicrodoses(microdoses) : microdoses,
    [microdoses],
  );
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const [experiencedIds, setExperiencedIds] = useState<Set<string>>(
    () => new Set(),
  );
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    window.setTimeout(() => {
      setExperiencedIds(readExperiencedIds());
    }, 0);
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel || visibleCount >= items.length) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((count) => Math.min(count + pageSize, items.length));
        }
      },
      { rootMargin: "480px" },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [items.length, visibleCount]);

  const visibleItems = items.slice(0, visibleCount);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center gap-3 text-sm font-bold uppercase tracking-[0.12em]">
        <span className="border-2 border-current bg-cmm-yellow/30 px-3 py-2">
          {items.length} tabs loaded
        </span>
        {activeTag ? (
          <Link
            href="/microdoses"
            className="border-2 border-foreground bg-cmm-yellow px-3 py-2 underline decoration-2 underline-offset-4"
          >
            Clear tag: {activeTag}
          </Link>
        ) : null}
      </div>

      <div
        className="grid gap-2 border-[6px] border-acid-tab-ink bg-microdose-sheet p-[12px]"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(min(9rem, 100%), 1fr))",
        }}
      >
        {visibleItems.map((microdose, index) => {
          const experienced = experiencedIds.has(microdose.id);
          const tabColorPair = pickTabColorPair(microdose, index);
          const tabStyle = {
            "--acid-tab-surface": tabColorPair.surface,
          } as CSSProperties;

          return (
            <Link
              href={microdose.href ?? `/microdoses/${microdose.id}`}
              key={microdose.sheetId ?? microdose.id}
              style={tabStyle}
              className={cn(
                "group relative aspect-square overflow-hidden p-2 text-foreground outline-none transition-colors [background:radial-gradient(circle_at_12px_0,var(--acid-tab-surface)_0_4px,var(--acid-tab-ink)_4.5px_6px,transparent_6.5px)_0_0/24px_12px_repeat-x,radial-gradient(circle_at_12px_100%,var(--acid-tab-surface)_0_4px,var(--acid-tab-ink)_4.5px_6px,transparent_6.5px)_0_100%/24px_12px_repeat-x,radial-gradient(circle_at_0_12px,var(--acid-tab-surface)_0_4px,var(--acid-tab-ink)_4.5px_6px,transparent_6.5px)_0_0/12px_24px_repeat-y,radial-gradient(circle_at_100%_12px,var(--acid-tab-surface)_0_4px,var(--acid-tab-ink)_4.5px_6px,transparent_6.5px)_100%_0/12px_24px_repeat-y,var(--acid-tab-surface)] focus-visible:z-10 focus-visible:ring-4 focus-visible:ring-cmm-coral",
              )}
            >
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-35 transition-transform duration-300 group-hover:scale-105 group-hover:opacity-50">
                <MicrodoseIconMark
                  icon={microdose.icon}
                  color={tabColorPair.icon}
                  className="size-14 md:size-16"
                />
              </span>
              <span className="relative z-10 flex h-full flex-col justify-between">
                {experienced ? (
                  <span className="ml-auto w-fit max-w-full border border-current bg-transparent px-1.5 py-1 text-[0.5rem] font-black uppercase leading-none tracking-[0.12em] opacity-80">
                    Seen
                  </span>
                ) : (
                  <span aria-hidden="true" />
                )}
                <span className="block max-w-[5.75rem] bg-acid-tab-title-surface px-1.5 py-1 font-serif text-[1rem] font-black italic leading-[0.95] text-foreground md:text-[1.08rem]">
                  {microdose.speakerLabel}
                </span>
              </span>
            </Link>
          );
        })}
      </div>

      {visibleCount < items.length ? (
        <div
          ref={sentinelRef}
          className="h-24"
          aria-hidden="true"
        />
      ) : null}
    </div>
  );
}
