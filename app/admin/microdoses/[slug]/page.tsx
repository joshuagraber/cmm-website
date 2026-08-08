import { notFound } from "next/navigation";
import { MicrodoseActions } from "@/components/admin/microdose-actions";
import { MicrodoseEditor } from "@/components/admin/microdose-editor";
import {
  archiveMicrodoseAction,
  publishMicrodoseAction,
  unpublishMicrodoseAction,
  updateMicrodoseAction,
} from "@/app/admin/actions";
import { databaseReady, requireAdminPage } from "@/lib/admin/guard";
import {
  getAdminMicrodose,
  listAudioAssets,
  listMicrodoseTags,
  listPeople,
} from "@/lib/admin/microdose-repository";

type AdminMicrodosePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function AdminMicrodosePage({
  params,
}: AdminMicrodosePageProps) {
  const { slug } = await params;

  await requireAdminPage(`/admin/microdoses/${slug}`);

  if (!databaseReady()) {
    return <p className="px-site-x py-section-y">DATABASE_URL is required.</p>;
  }

  const [microdose, people, audioAssets, existingTags] = await Promise.all([
    getAdminMicrodose(slug),
    listPeople(),
    listAudioAssets(),
    listMicrodoseTags(),
  ]);

  if (!microdose) {
    notFound();
  }

  const updateAction = updateMicrodoseAction.bind(null, slug);
  const publishAction = publishMicrodoseAction.bind(null, microdose.slug);
  const unpublishAction = unpublishMicrodoseAction.bind(null, microdose.slug);
  const archiveAction = archiveMicrodoseAction.bind(null, microdose.slug);
  const formId = `microdose-editor-${microdose.id}`;
  const savedStateKey = [
    microdose.draftRevisionId,
    microdose.draftUpdatedAt.toISOString(),
  ].join(":");
  const editorStateKey = [
    savedStateKey,
    microdose.audioAssetId ?? "no-audio",
    microdose.transcript.length,
    microdose.transcript.at(-1)?.end ?? 0,
  ].join(":");
  const statusLabel = microdose.isPublished
    ? microdose.hasStagedChanges
      ? "Published / staged changes"
      : "Published"
    : "Draft";

  return (
    <section className="px-site-x py-section-y">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="mb-3 font-bold uppercase tracking-[0.16em]">
            {statusLabel}
          </p>
          <h1 className="font-serif text-6xl font-black leading-none">
            {microdose.title}
          </h1>
        </div>
        <MicrodoseActions
          key={`${savedStateKey}:${microdose.hasStagedChanges}`}
          isPublished={microdose.isPublished}
          hasStagedChanges={microdose.hasStagedChanges}
          publishAction={publishAction}
          unpublishAction={unpublishAction}
          archiveAction={archiveAction}
        />
      </div>

      <MicrodoseEditor
        key={editorStateKey}
        formId={formId}
        savedStateKey={savedStateKey}
        autosaveSlug={microdose.slug}
        action={updateAction}
        people={people}
        audioAssets={audioAssets}
        existingTags={existingTags}
        hideSubmitButton
        value={microdose}
      />
    </section>
  );
}
