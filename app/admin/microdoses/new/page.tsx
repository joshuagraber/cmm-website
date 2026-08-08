import { MicrodoseEditor } from "@/components/admin/microdose-editor";
import { databaseReady, requireAdminPage } from "@/lib/admin/guard";
import {
  listAudioAssets,
  listMicrodoseTags,
  listPeople,
} from "@/lib/admin/microdose-repository";
import { createMicrodoseAction } from "@/app/admin/actions";

export default async function NewMicrodosePage() {
  await requireAdminPage("/admin/microdoses/new");

  if (!databaseReady()) {
    return <p className="px-site-x py-section-y">DATABASE_URL is required.</p>;
  }

  const [people, audioAssets, existingTags] = await Promise.all([
    listPeople(),
    listAudioAssets(),
    listMicrodoseTags(),
  ]);

  return (
    <section className="px-site-x py-section-y">
      <div className="mb-10">
        <p className="mb-3 font-bold uppercase tracking-[0.16em]">Draft</p>
        <h1 className="font-serif text-6xl font-black leading-none">
          New microdose
        </h1>
      </div>
      <MicrodoseEditor
        action={createMicrodoseAction}
        people={people}
        audioAssets={audioAssets}
        existingTags={existingTags}
        draftStorageKey="cmm.admin.microdose.new"
        value={{
          slug: "",
          title: "",
          description: "",
          speakerLabel: "",
          icon: "molecule",
          audioAssetId: null,
          audioSrc: null,
          tags: [],
          speakerIds: [],
          subjectIds: [],
          transcript: [],
        }}
      />
    </section>
  );
}
