import { upsertPersonAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { databaseReady, requireAdminPage } from "@/lib/admin/guard";
import { listPeople } from "@/lib/admin/microdose-repository";

type AdminPeoplePageProps = {
  searchParams: Promise<{
    returnTo?: string;
  }>;
};

export default async function AdminPeoplePage({
  searchParams,
}: AdminPeoplePageProps) {
  await requireAdminPage("/admin/people");

  if (!databaseReady()) {
    return <p className="px-site-x py-section-y">DATABASE_URL is required.</p>;
  }

  const people = await listPeople();
  const { returnTo } = await searchParams;
  const safeReturnTo = normalizeAdminReturnPath(returnTo);

  return (
    <section className="px-site-x py-section-y">
      <div className="mb-10">
        <p className="mb-3 font-bold uppercase tracking-[0.16em]">Admin</p>
        <h1 className="font-serif text-6xl font-black leading-none">People</h1>
      </div>
      <section className="grid gap-5 border-[6px] border-foreground p-5">
        <h2 className="font-serif text-4xl font-black">Add person</h2>
        <PersonForm
          action={upsertPersonAction}
          returnTo={safeReturnTo}
          submitLabel="Save person"
        />
        <div className="grid gap-3">
          {people.map((person) => (
            <article key={person.id} className="border-2 border-foreground p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="font-serif text-2xl font-black">
                    {person.name}
                  </h3>
                  <p className="font-mono text-sm">{person.id}</p>
                </div>
                <details className="w-full md:w-auto md:min-w-[28rem]">
                  <summary className="cursor-pointer font-bold uppercase tracking-[0.08em] underline decoration-2 underline-offset-4">
                    Edit
                  </summary>
                  <div className="mt-4">
                    <PersonForm
                      action={upsertPersonAction}
                      returnTo={safeReturnTo}
                      person={{
                        id: person.id,
                        name: person.name,
                        bio: person.bioMarkdown,
                      }}
                      submitLabel="Save changes"
                    />
                  </div>
                </details>
              </div>
              {person.bioMarkdown ? (
                <p className="mt-4 max-w-2xl text-sm leading-relaxed">
                  {person.bioMarkdown}
                </p>
              ) : null}
            </article>
          ))}
          {people.length === 0 ? <p>No people yet.</p> : null}
        </div>
      </section>
    </section>
  );
}

function PersonForm({
  action,
  person,
  returnTo,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  person?: { id: string; name: string; bio: string };
  returnTo?: string;
  submitLabel: string;
}) {
  const inputId = person ? `person-${person.id}` : "person";

  return (
    <form action={action} className="grid gap-4 border-2 border-foreground p-4">
      {person ? <input type="hidden" name="id" value={person.id} /> : null}
      {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
      <div>
        <Label htmlFor={`${inputId}-name`}>Name</Label>
        <Input
          id={`${inputId}-name`}
          name="name"
          defaultValue={person?.name ?? ""}
          required
        />
      </div>
      <div>
        <Label htmlFor={`${inputId}-bio`}>Bio Markdown</Label>
        <Textarea
          id={`${inputId}-bio`}
          name="bio"
          rows={4}
          defaultValue={person?.bio ?? ""}
        />
      </div>
      <Button type="submit" variant="primary" className="w-fit">
        {submitLabel}
      </Button>
    </form>
  );
}

function normalizeAdminReturnPath(value: string | undefined) {
  if (!value?.startsWith("/admin/") || value.startsWith("//")) {
    return undefined;
  }

  return value;
}
