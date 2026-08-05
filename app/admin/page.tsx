import Link from "next/link";
import { databaseReady, requireAdminPage } from "@/lib/admin/guard";
import { listAdminMicrodoses } from "@/lib/admin/microdose-repository";

export default async function AdminPage() {
  await requireAdminPage("/admin");

  if (!databaseReady()) {
    return (
      <section className="px-site-x py-section-y">
        <h1 className="font-serif text-6xl font-black leading-none">
          Database required
        </h1>
        <p className="mt-6 max-w-2xl text-xl leading-relaxed">
          Set `DATABASE_URL`, run the Drizzle migration, and import the seed
          content before using the admin CMS.
        </p>
      </section>
    );
  }

  const microdoses = await listAdminMicrodoses();

  return (
    <section className="px-site-x py-section-y">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="mb-3 font-bold uppercase tracking-[0.16em]">Admin</p>
          <h1 className="font-serif text-6xl font-black leading-none">
            Microdoses
          </h1>
        </div>
        <Link
          href="/admin/microdoses/new"
          className="inline-flex h-14 items-center justify-center rounded-[var(--radius-button)] border-2 border-foreground bg-transparent px-8 text-base font-bold text-foreground transition-colors hover:bg-foreground hover:text-background"
        >
          New microdose
        </Link>
      </div>

      <div className="grid gap-3">
        {microdoses.map((microdose) => (
          <Link
            key={microdose.id}
            href={`/admin/microdoses/${microdose.slug}`}
            className="grid gap-2 border-[6px] border-foreground bg-microdose-detail-surface p-5 md:grid-cols-[1fr_auto]"
          >
            <span>
              <span className="block font-serif text-3xl font-black">
                {microdose.title}
              </span>
              <span className="mt-1 block font-mono text-sm">{microdose.slug}</span>
            </span>
            <span className="h-fit border-2 border-foreground px-3 py-2 text-sm font-black uppercase">
              {microdose.status}
            </span>
          </Link>
        ))}
        {microdoses.length === 0 ? (
          <p className="border-[6px] border-foreground p-5 text-xl">
            No microdoses yet.
          </p>
        ) : null}
      </div>
    </section>
  );
}
