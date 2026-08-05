import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b-[6px] border-black bg-cmm-yellow px-site-x py-5 text-black">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/admin"
            className="font-serif text-3xl font-black leading-none text-black md:text-4xl"
          >
            CMM Admin
          </Link>
          <nav
            aria-label="Admin navigation"
            className="flex flex-wrap items-center gap-5 text-sm font-black uppercase tracking-[0.12em]"
          >
            <Link
              href="/admin"
              className="text-black underline decoration-2 underline-offset-4 transition-opacity hover:opacity-70"
            >
              Microdoses
            </Link>
            <Link
              href="/admin/microdoses/new"
              className="text-black underline decoration-2 underline-offset-4 transition-opacity hover:opacity-70"
            >
              New
            </Link>
            <Link
              href="/admin/people"
              className="text-black underline decoration-2 underline-offset-4 transition-opacity hover:opacity-70"
            >
              People
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </main>
  );
}
