import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkdownText } from "@/components/cmm/markdown-text";
import { AudioMicrodoseExperience } from "@/components/microdoses/audio-microdose-experience";
import { SiteHeader } from "@/components/cmm/site-header";
import {
  getMicrodoseById,
  stripMarkdown,
} from "@/lib/microdoses";

type MicrodoseDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: MicrodoseDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const microdose = await getMicrodoseById(id);

  if (!microdose) {
    return {
      title: "Microdose not found | Cool Molecules Media",
    };
  }

  return {
    title: `${microdose.title} | Cool Molecules Media`,
    description: stripMarkdown(microdose.description),
  };
}

export default async function MicrodoseDetailPage({
  params,
}: MicrodoseDetailPageProps) {
  const { id } = await params;
  const microdose = await getMicrodoseById(id);

  if (!microdose) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader active="microdoses" />
      <section className="cmm-yellow-field px-site-x py-section-y">
        <Link
          href="/microdoses"
          className="font-bold uppercase tracking-[0.12em] underline decoration-2 underline-offset-4"
        >
          Back to microdoses
        </Link>
        <div className="mb-12 mt-8 max-w-5xl">
          <p className="mb-4 font-bold uppercase tracking-[0.16em]">
            {microdose.speakerLabel}
          </p>
          <h1 className="font-serif text-6xl font-black leading-none md:text-8xl">
            {microdose.title}
          </h1>
          <div className="mt-8 max-w-3xl text-2xl leading-snug">
            <MarkdownText value={microdose.description} />
          </div>
        </div>

        {microdose.media.type === "audio" ? (
          <AudioMicrodoseExperience microdose={microdose} />
        ) : null}
      </section>
    </main>
  );
}
