// frontend/app/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

import HeroLead from "./_components/HeroLead";
import StoryCard from "./_components/StoryCard"; // CardGrid equivalent (image top)
import CardRow from "./_components/CardRow";
import CardTextOnly from "./_components/CardTextOnly";
import SidebarList, { type SidebarItem } from "./_components/SidebarList";
import NewsletterCTA from "./_components/NewsletterCTA";

const STRAPI_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL ??
  process.env.STRAPI_URL ??
  "http://localhost:1337";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.SITE_URL ??
  "http://localhost:3000";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "News Platform";
const SITE_LOGO = process.env.NEXT_PUBLIC_SITE_LOGO ?? `${SITE_URL}/favicon.ico`;

export const metadata: Metadata = {
  title: `${SITE_NAME} — Latest Articles`,
  description: "Latest published articles.",
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: `${SITE_NAME} — Latest Articles`,
    description: "Latest published articles.",
    type: "website",
    url: SITE_URL,
    images: SITE_LOGO ? [{ url: SITE_LOGO }] : undefined,
  },
  twitter: {
    card: SITE_LOGO ? "summary_large_image" : "summary",
    title: `${SITE_NAME} — Latest Articles`,
    description: "Latest published articles.",
    images: SITE_LOGO ? [SITE_LOGO] : undefined,
  },
};

// ---- Types (Strapi v4 + v5 friendly) ----
type StrapiV4Item<T> = { id: number; attributes: T };
type StrapiV5Item<T> = T & { id: number; documentId?: string };

type StrapiListResponse<T> = {
  data: Array<StrapiV4Item<T> | StrapiV5Item<T>>;
  meta?: any;
};

type StrapiMediaFormat = { url: string; width?: number; height?: number };

type StrapiMedia =
  | {
      data?:
        | {
            attributes?: {
              url?: string;
              formats?: Record<string, StrapiMediaFormat>;
            };
          }
        | null;
    }
  | {
      url?: string;
      formats?: Record<string, StrapiMediaFormat>;
    }
  | null
  | undefined;

type CategoryFields = {
  id?: number;
  documentId?: string;
  name?: string;
  slug?: string;
};

type StrapiCategoryRel =
  | CategoryFields
  | StrapiV4Item<CategoryFields>
  | { data?: StrapiV4Item<CategoryFields> | CategoryFields | null }
  | null
  | undefined;

type AuthorFields = {
  id?: number;
  documentId?: string;
  name?: string;
  slug?: string;
};

type StrapiAuthorRel =
  | AuthorFields
  | StrapiV4Item<AuthorFields>
  | { data?: StrapiV4Item<AuthorFields> | AuthorFields | null }
  | null
  | undefined;

type ArticleFields = {
  title?: string;
  slug?: string;
  excerpt?: string | null;
  publishedAt?: string | null;
  cover_image?: StrapiMedia;
  category?: StrapiCategoryRel;
  author?: StrapiAuthorRel;
};

// ---- Helpers ----
function absoluteUrl(path?: string | null) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${STRAPI_URL}${path}`;
}

function pickBestFromFormats(formats?: Record<string, StrapiMediaFormat>) {
  if (!formats || typeof formats !== "object") return null;
  return formats.large ?? formats.medium ?? formats.small ?? formats.thumbnail ?? null;
}

function extractCoverUrl(cover: StrapiMedia): string {
  if (!cover) return "";
  const v4Attrs = (cover as any)?.data?.attributes;
  if (v4Attrs) {
    const best = pickBestFromFormats(v4Attrs.formats);
    return absoluteUrl(best?.url ?? v4Attrs.url ?? "");
  }
  const v5Url = (cover as any)?.url;
  const v5Formats = (cover as any)?.formats;
  const best = pickBestFromFormats(v5Formats);
  return absoluteUrl(best?.url ?? v5Url ?? "");
}

function normalizeCategory(
  rel: StrapiCategoryRel
): { id?: number; name: string; slug: string } | null {
  if (!rel) return null;
  const relData = (rel as any)?.data ?? null;
  const candidate = relData ?? rel;

  if (candidate && typeof candidate === "object" && "attributes" in candidate) {
    const a = (candidate as StrapiV4Item<CategoryFields>).attributes ?? {};
    return {
      id: (candidate as any).id,
      name: a.name ?? "Uncategorized",
      slug: a.slug ?? "",
    };
  }

  const a = (candidate as any) ?? {};
  return { id: a.id, name: a.name ?? "Uncategorized", slug: a.slug ?? "" };
}

function normalizeAuthor(
  rel: StrapiAuthorRel
): { id?: number; name: string; slug: string } | null {
  if (!rel) return null;
  const relData = (rel as any)?.data ?? null;
  const candidate = relData ?? rel;

  if (candidate && typeof candidate === "object" && "attributes" in candidate) {
    const a = (candidate as StrapiV4Item<AuthorFields>).attributes ?? {};
    return { id: (candidate as any).id, name: a.name ?? "Unknown", slug: a.slug ?? "" };
  }

  const a = (candidate as any) ?? {};
  return { id: a.id, name: a.name ?? "Unknown", slug: a.slug ?? "" };
}

function normalizeArticle(item: StrapiV4Item<ArticleFields> | StrapiV5Item<ArticleFields>) {
  if (item && typeof item === "object" && "attributes" in item) {
    const a = (item as StrapiV4Item<ArticleFields>).attributes ?? {};
    return {
      id: (item as any).id,
      title: a.title ?? "Untitled",
      slug: a.slug ?? "",
      excerpt: a.excerpt ?? null,
      publishedAt: a.publishedAt ?? null,
      coverUrl: extractCoverUrl(a.cover_image),
      category: normalizeCategory(a.category),
      author: normalizeAuthor(a.author),
    };
  }

  const a = (item as any) ?? {};
  return {
    id: a.id,
    title: a.title ?? "Untitled",
    slug: a.slug ?? "",
    excerpt: a.excerpt ?? null,
    publishedAt: a.publishedAt ?? null,
    coverUrl: extractCoverUrl(a.cover_image),
    category: normalizeCategory(a.category),
    author: normalizeAuthor(a.author),
  };
}

function getMetaPagination(meta: any) {
  const p = meta?.pagination ?? meta?.meta?.pagination ?? null;
  if (!p) return { page: 1, pageCount: 1, total: 0, pageSize: 9 };
  return {
    page: Number(p.page ?? 1),
    pageCount: Number(p.pageCount ?? 1),
    total: Number(p.total ?? 0),
    pageSize: Number(p.pageSize ?? 9),
  };
}

function buildUrl(params: { q: string; page: number; pageSize: number }) {
  const { q, page, pageSize } = params;

  const qp = new URLSearchParams();
  qp.set("populate", "*");
  qp.set("sort", "publishedAt:desc");
  qp.set("pagination[page]", String(page));
  qp.set("pagination[pageSize]", String(pageSize));

  if (q.trim()) {
    qp.set("filters[$or][0][title][$containsi]", q.trim());
    qp.set("filters[$or][1][excerpt][$containsi]", q.trim());
  }

  return `${STRAPI_URL}/api/articles?${qp.toString()}`;
}

// tiny date formatter helper
function formatDateShort(iso?: string | null) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

const headlineClass = "font-[var(--font-serif)]";

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; q?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const q = typeof sp.q === "string" ? sp.q : "";
  const page = Math.max(1, Number(sp.page ?? "1") || 1);

  const pageSize = 9;
  const url = buildUrl({ q, page, pageSize });

  let json: StrapiListResponse<ArticleFields> | null = null;

  try {
    const res = await fetch(url, { cache: "no-store" });
    const contentType = res.headers.get("content-type") || "";
    const text = await res.text();

    if (!res.ok) {
      return (
        <main className="min-h-screen bg-[var(--surface)] px-4 py-10 text-[var(--foreground)]">
          <div className="mx-auto max-w-6xl">
            <h1 className={`text-3xl font-bold tracking-tight ${headlineClass}`}>
              {SITE_NAME}
            </h1>
            <p className="mt-4 rounded-xl border border-[var(--border)] bg-white p-4 text-red-600">
              Failed to load articles: {res.status} {res.statusText}
            </p>
            <p className="mt-2 text-xs text-[var(--muted)]">URL: {url}</p>
            <pre className="mt-4 whitespace-pre-wrap rounded-xl border border-[var(--border)] bg-white p-4 text-xs">
              {text.slice(0, 2000)}
            </pre>
          </div>
        </main>
      );
    }

    if (!contentType.includes("application/json")) {
      return (
        <main className="min-h-screen bg-[var(--surface)] px-4 py-10 text-[var(--foreground)]">
          <div className="mx-auto max-w-6xl">
            <h1 className={`text-3xl font-bold tracking-tight ${headlineClass}`}>
              {SITE_NAME}
            </h1>
            <p className="mt-4 rounded-xl border border-[var(--border)] bg-white p-4 text-red-600">
              Strapi returned NON-JSON ({contentType}).
            </p>
            <p className="mt-2 text-xs text-[var(--muted)]">URL: {url}</p>
            <pre className="mt-4 whitespace-pre-wrap rounded-xl border border-[var(--border)] bg-white p-4 text-xs">
              {text.slice(0, 2000)}
            </pre>
          </div>
        </main>
      );
    }

    json = JSON.parse(text) as StrapiListResponse<ArticleFields>;
  } catch (err: any) {
    return (
      <main className="min-h-screen bg-[var(--surface)] px-4 py-10 text-[var(--foreground)]">
        <div className="mx-auto max-w-6xl">
          <h1 className={`text-3xl font-bold tracking-tight ${headlineClass}`}>
            {SITE_NAME}
          </h1>
          <p className="mt-4 rounded-xl border border-[var(--border)] bg-white p-4 text-red-600">
            Fetch failed (Strapi unreachable).
          </p>
          <p className="mt-2 text-xs text-[var(--muted)]">URL: {url}</p>
          <pre className="mt-4 whitespace-pre-wrap rounded-xl border border-[var(--border)] bg-white p-4 text-xs">
            {String(err?.message ?? err)}
          </pre>
        </div>
      </main>
    );
  }

  const pagination = getMetaPagination(json?.meta);
  const articles = (json?.data ?? []).map(normalizeArticle).filter((a) => a && a.slug);

  const [hero, ...rest] = articles;

  // Sidebar items (✅ FIX: use `meta`, not `date`)
  function toSidebarItem(a: (typeof articles)[number]): SidebarItem {
    return {
      href: `/article/${a.slug}`,
      title: a.title,
      meta: formatDateShort(a.publishedAt),
    };
  }

  // simple deterministic widgets (replace later with real analytics)
  const latestItems = articles.slice(0, 5).map(toSidebarItem);
  const mostPopularItems = articles.slice(5, 10).map(toSidebarItem);
  const mostReadItems = articles.slice(10, 15).map(toSidebarItem);

  const makePageHref = (p: number) => {
    const qs = new URLSearchParams();
    if (q.trim()) qs.set("q", q.trim());
    qs.set("page", String(p));
    return `/?${qs.toString()}`;
  };

  return (
    <main className="min-h-screen bg-[var(--surface)] px-4 py-8 text-[var(--foreground)]">
      <div className="mx-auto max-w-6xl">
        {/* temporary header (2.1a SiteHeader comes later) */}
        <header className="mb-6 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className={`text-4xl font-bold tracking-tight ${headlineClass}`}>
                {SITE_NAME}
              </h1>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Latest published articles from Strapi.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/categories"
                className="text-sm font-medium underline decoration-[var(--border)] underline-offset-4 hover:decoration-[var(--accent)]"
              >
                All categories →
              </Link>
            </div>
          </div>

          <form action="/" method="GET" className="mt-6 flex flex-wrap gap-2">
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search articles…"
              className="w-full flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
            />
            <button
              type="submit"
              className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-black hover:opacity-95"
            >
              Search
            </button>

            {q.trim() ? (
              <Link
                href="/"
                className="rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-medium hover:bg-[var(--surface)]"
              >
                Clear
              </Link>
            ) : null}
          </form>

          <p className="mt-3 text-sm text-[var(--muted)]">
            {q.trim()
              ? `Showing results for "${q.trim()}" — ${pagination.total} found`
              : `Total articles: ${pagination.total}`}
          </p>
        </header>

        {/* 4.1a: Desktop 12 columns (8 main + 4 sidebar) */}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* MAIN */}
          <section className="space-y-8 lg:col-span-8">
            {hero ? (
              <HeroLead
                href={`/article/${hero.slug}`}
                title={hero.title}
                excerpt={hero.excerpt}
                coverUrl={hero.coverUrl}
                publishedAt={hero.publishedAt}
              />
            ) : (
              <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
                <p className="font-semibold">No articles found.</p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Publish articles in Strapi and ensure Public role has "find".
                </p>
              </section>
            )}

            {rest.length > 0 ? (
              <div className="space-y-6">
                {/* Row cards (first 2) */}
                <div className="space-y-6">
                  {rest.slice(0, 2).map((a) => (
                    <CardRow
                      key={a.id}
                      href={`/article/${a.slug}`}
                      title={a.title}
                      excerpt={a.excerpt}
                      coverUrl={a.coverUrl}
                      publishedAt={a.publishedAt}
                    />
                  ))}
                </div>

                {/* Grid cards (next 6) */}
                <div className="grid gap-6 md:grid-cols-2">
                  {rest.slice(2, 8).map((a) => (
                    <StoryCard
                      key={a.id}
                      href={`/article/${a.slug}`}
                      title={a.title}
                      excerpt={a.excerpt}
                      coverUrl={a.coverUrl}
                      publishedAt={a.publishedAt}
                    />
                  ))}
                </div>

                {/* Text-only (next 4) */}
                {rest.slice(8, 12).length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2">
                    {rest.slice(8, 12).map((a) => (
                      <CardTextOnly
                        key={a.id}
                        href={`/article/${a.slug}`}
                        title={a.title}
                        excerpt={a.excerpt}
                        publishedAt={a.publishedAt}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* pagination */}
            {pagination.pageCount > 1 ? (
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <Link
                  href={makePageHref(Math.max(1, pagination.page - 1))}
                  className={`rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm ${
                    pagination.page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-[var(--surface)]"
                  }`}
                >
                  ← Prev
                </Link>

                {Array.from({ length: pagination.pageCount }).map((_, i) => {
                  const p = i + 1;
                  const active = p === pagination.page;
                  return (
                    <Link
                      key={p}
                      href={makePageHref(p)}
                      className={`rounded-xl border border-[var(--border)] px-3 py-2 text-sm ${
                        active ? "bg-[var(--brand)] text-white" : "bg-white hover:bg-[var(--surface)]"
                      }`}
                    >
                      {p}
                    </Link>
                  );
                })}

                <Link
                  href={makePageHref(Math.min(pagination.pageCount, pagination.page + 1))}
                  className={`rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm ${
                    pagination.page >= pagination.pageCount
                      ? "pointer-events-none opacity-40"
                      : "hover:bg-[var(--surface)]"
                  }`}
                >
                  Next →
                </Link>
              </div>
            ) : null}
          </section>

          {/* SIDEBAR */}
          <aside className="space-y-6 lg:col-span-4">
            <SidebarList title="Most popular" items={mostPopularItems} />
            <SidebarList title="Latest" items={latestItems} />
            <SidebarList title="Most read" items={mostReadItems} />
            <NewsletterCTA />
          </aside>
        </div>

        <footer className="mt-12 border-t border-[var(--border)] pt-6 text-sm text-[var(--muted)]">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={SITE_LOGO}
              alt={SITE_NAME}
              className="h-7 w-7 rounded bg-white p-1"
            />
            <span>{SITE_NAME}</span>
            <span className="ml-auto text-xs">Powered by Strapi • Styled with Tailwind</span>
          </div>
        </footer>
      </div>
    </main>
  );
}