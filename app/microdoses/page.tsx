import type { Metadata } from "next";
import { MicrodoseSheet } from "@/components/microdoses/microdose-sheet";
import { SiteHeader } from "@/components/cmm/site-header";
import { getMicrodoseSheetItems } from "@/app/microdoses/mock-microdoses";
import { getAllMicrodoses } from "@/lib/microdoses";

export const metadata: Metadata = {
  title: "Microdoses | Cool Molecules Media",
  description: "Short-form audio experiences from Cool Molecules Media.",
};

type MicrodosesPageProps = {
  searchParams: Promise<{
    tags?: string | string[];
  }>;
};

function getActiveTag(tags: string | string[] | undefined) {
  const value = Array.isArray(tags) ? tags[0] : tags;

  return value?.trim() || undefined;
}

export default async function MicrodosesPage({
  searchParams,
}: MicrodosesPageProps) {
  const query = await searchParams;
  const activeTag = getActiveTag(query.tags);
  const microdoses = getAllMicrodoses().filter((microdose) =>
    activeTag ? microdose.tags.includes(activeTag) : true,
  );
  const sheetItems = getMicrodoseSheetItems(microdoses);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader active="microdoses" />
      <section className="cmm-yellow-field px-site-x py-section-y">
        <div className="mb-12 max-w-5xl">
          <p className="mb-4 font-bold uppercase tracking-[0.16em]">
            Microdoses
          </p>
          <h1 className="font-serif text-6xl font-black leading-none md:text-8xl">
            Small tabs, strange signals.
          </h1>
          <p className="mt-8 max-w-3xl text-2xl leading-snug">
            Short, sensory fragments from the CMM archive and adjacent
            undergrounds.
          </p>
        </div>
        <MicrodoseSheet microdoses={sheetItems} activeTag={activeTag} />
      </section>
    </main>
  );
}
