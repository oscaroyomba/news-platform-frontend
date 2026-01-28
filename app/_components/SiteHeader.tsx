// frontend/app/_components/SiteHeader.tsx
import Link from "next/link";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "News Platform";
const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL ?? "http://localhost:1337";

type Cat = { name: string; slug: string };

function normalizeCat(item: any): Cat | null {
  const a = item?.attributes ?? item;
  const name = a?.name;
  const slug = a?.slug;
  if (!name || !slug) return null;
  return { name, slug };
}

async function getTopCategories(): Promise<Cat[]> {
  try {
    const url =
      `${STRAPI_URL}/api/categories` +
      `?fields[0]=name&fields[1]=slug&pagination[pageSize]=5&sort[0]=id:asc`;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];

    const json = await res.json();
    const rows = json?.data ?? [];
    return rows.map(normalizeCat).filter(Boolean) as Cat[];
  } catch {
    return [];
  }
}

export default async function SiteHeader() {
  const cats = await getTopCategories();

  // fallback if Strapi is down / empty
  const NAV =
    cats.length > 0
      ? cats.map((c) => ({ label: c.name, href: `/category/${c.slug}` }))
      : [
          { label: "News", href: "/category/news" },
          { label: "Opinion", href: "/category/opinion" },
          { label: "Sport", href: "/category/sport" },
          { label: "Culture", href: "/category/culture" },
          { label: "Lifestyle", href: "/category/lifestyle" },
        ];

  return (
    <header className="border-b border-[var(--border)] bg-white">
      {/* Top strip */}
      <div className="bg-[var(--brand)] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 text-xs md:px-6">
          <div className="flex items-center gap-2">
            <span className="bg-white/10 px-2 py-0.5">International</span>
            <span className="opacity-80">Edition</span>
          </div>

          <div className="flex items-center gap-3">
            <Link className="opacity-90 hover:opacity-100 hover:underline" href="/search">
              Search
            </Link>
            <span className="opacity-40">•</span>
            <Link className="opacity-90 hover:opacity-100 hover:underline" href="/about">
              About
            </Link>
          </div>
        </div>
      </div>

      {/* Masthead */}
      <div className="bg-[var(--brand)] text-white">
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <Link href="/" className="group">
              <div className="text-3xl font-bold tracking-tight md:text-5xl font-[var(--font-serif)]">
                {SITE_NAME}
              </div>
              <div className="mt-1 h-1 w-24 bg-[var(--accent)] transition group-hover:w-32" />
            </Link>

            <Link
              href="/search"
              className="bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-black hover:opacity-95"
            >
              Search
            </Link>
          </div>
        </div>
      </div>

      {/* Primary nav */}
      <nav className="bg-white">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 py-3 text-sm">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="font-medium text-[var(--foreground)] hover:underline decoration-[var(--accent)] underline-offset-4"
              >
                {item.label}
              </Link>
            ))}

            <span className="ml-auto hidden h-5 w-px bg-[var(--border)] md:block" />

            <Link
              href="/"
              className="ml-auto hidden border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[var(--foreground)] hover:bg-white md:inline-flex"
            >
              Latest
            </Link>
          </div>
        </div>

        {/* thin accent line */}
        <div className="h-1 w-full bg-[var(--accent)]" />
      </nav>
    </header>
  );
}