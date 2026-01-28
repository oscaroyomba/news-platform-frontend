// frontend/app/category/[slug]/page.tsx

import type { Metadata } from "next";
import Link from "next/link";

import CardRow from "../../_components/CardRow";
import StoryCard from "../../_components/StoryCard";
import CardTextOnly from "../../_components/CardTextOnly";
import SidebarList, { type SidebarItem } from "../../_components/SidebarList";
import NewsletterCTA from "../../_components/NewsletterCTA";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const STRAPI_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL ??
  process.env.STRAPI_URL ??
  "http://localhost:1337";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "News Platform";

// ---------- Types (support Strapi v4 + v5 response shapes) ----------
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
  name?: string;
  slug?: string;
};

type ArticleFields = {
  title?: string;
  slug?: string;
  excerpt?: string | null;
  publishedAt?: string | null;
  cover_image?: StrapiMedia;
  category?: any;
  author?: any;
};

// ---------- Helpers ----------
function normalizeItem<T extends object>(
  item: StrapiV4Item<T> | StrapiV5Item<T>
): T & { id: number } {
  // v4
  if (item && typeof item === "object" && "attributes" in item) {
    const a = (item as StrapiV4Item<T>).attributes ?? ({} as T);
    return { id: item.id, ...(a as any) };
  }
  // v5
  const a = (item as any) ?? {};
  return { id: a.id, ...(a as any) };
}

function absoluteUrl(path?: string | null) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${STRAPI_URL}${path}`;
}

function pickBestFromFormats(formats?: Record<string, StrapiMediaFormat>) {
  if (!formats || typeof formats !== "object") return null;
  return (
    formats.large ??
    formats.medium ??
    formats.small ??
    formats.thumbnail ??
    null
  );
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

function getMetaPagination(meta: any) {
  const p = meta?.pagination ?? meta?.meta?.pagination ?? null;
  if (!p) return { page: 1, pageCount: 1, total: 0, pageSize: 12 };
  return {
    page: Number(p.page ?? 1),
    pageCount: Number(p.pageCount ?? 1),
    total: Number(p.total ?? 0),
    pageSize: Number(p.pageSize ?? 12),
  };
}

// ---------- Data ----------
async function fetchCategoryBySlug(
  slug: string
): Promise<(CategoryFields & { id: number }) | null> {
  const url = `${STRAPI_URL}/api/categories?filters[slug][$eq]=${encodeURIComponent(
    slug
  )}&pagination[pageSize]=1`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;

  const json = (await res.json()) as StrapiListResponse<CategoryFields>;
  const row: any = json.data?.[0];
  if (!row) return null;

  return normalizeItem<CategoryFields>(row);
}

function buildArticlesUrl(params: { slug: string; page: number; pageSize: number }) {
  const { slug, page, pageSize } = params;
  const qp = new URLSearchParams();
  qp.set("populate", "*");
  qp.set("sort", "publishedAt:desc");
  qp.set("pagination[page]", String(page));
  qp.set("pagination[pageSize]", String(pageSize));
  qp.set("filters[category][slug][$eq]", slug);
  return `${STRAPI_URL}/api/articles?${qp.toString()}`;
}

// ✅ SEO for dynamic category pages
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  let categoryName = slug;
  try {
    const c = await fetchCategoryBySlug(slug);
    if (c?.name) categoryName = c.name;
  } catch {
    // ignore
  }

  const title = `${categoryName} — ${SITE_NAME}`;
  const description = `Read the latest articles in ${categoryName}.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

const headlineClass = "font-[var(--font-serif)]";

export default async function CategoryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const sp = (await searchParams) ?? {};
  const page = Math.max(1, Number(sp.page ?? "1") || 1);

  // Category lookup (but do NOT 404 if missing)
  const category = await fetchCategoryBySlug(slug);
  const safeCategory: (CategoryFields & { id: number }) = category ?? {
    id: 0,
    name: slug,
    slug,
  };

  // ------------------------------------------------------------
  // SKIP-FETCH FIX:
  // If category doesn't exist in Strapi (safeCategory.id === 0),
  // do NOT call /api/articles at all. Just show empty state UI.
  // ------------------------------------------------------------
  const pageSize = 12;

  let pagination = { page: 1, pageCount: 1, total: 0, pageSize };
  let articles: Array<{
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    publishedAt: string | null;
    coverUrl: string;
  }> = [];

  if (safeCategory.id !== 0) {
    const url = buildArticlesUrl({ slug, page, pageSize });

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return (
        <main className="min-h-screen bg-[var(--surface)] px-4 py-10 text-[var(--foreground)]">
          <div className="mx-auto max-w-6xl">
            <h1 className={`text-3xl font-bold tracking-tight ${headlineClass}`}>
              {SITE_NAME}
            </h1>
            <p className="mt-4 rounded-xl border border-[var(--border)] bg-white p-4 text-red-600">
              Failed to load category articles: {res.status} {res.statusText}
            </p>
            <p className="mt-2 text-xs text-[var(--muted)]">URL: {url}</p>
          </div>
        </main>
      );
    }

    const json = (await res.json()) as StrapiListResponse<ArticleFields>;
    pagination = getMetaPagination(json?.meta);

    const raw = (json.data ?? []).map((row: any) =>
      normalizeItem<ArticleFields>(row)
    );

    articles = raw
      .map((a) => ({
        id: a.id,
        title: a.title ?? "Untitled",
        slug: a.slug ?? "",
        excerpt: a.excerpt ?? null,
        publishedAt: a.publishedAt ?? null,
        coverUrl: extractCoverUrl(a.cover_image),
      }))
      .filter((a) => a.slug);
  }

  // Sidebar widgets (deterministic for now)
  function toSidebarItem(a: (typeof articles)[number]): SidebarItem {
    const date = formatDateShort(a.publishedAt);
    const cat = safeCategory.name ?? "";
    const meta = [date, cat].filter(Boolean).join(" • ");
    return {
      href: `/article/${a.slug}`,
      title: a.title,
      meta: meta || null,
    };
  }

  const latestItems = articles.slice(0, 5).map(toSidebarItem);
  const mostPopularItems = articles.slice(5, 10).map(toSidebarItem);
  const mostReadItems = articles.slice(10, 15).map(toSidebarItem);

  const makePageHref = (p: number) => {
    const qs = new URLSearchParams();
    qs.set("page", String(p));
    return `/category/${slug}?${qs.toString()}`;
  };

  const displayName =
    safeCategory.name ??
    (safeCategory.slug ? safeCategory.slug : "Category");

  return (
    <main className="min-h-screen bg-[var(--surface)] px-4 py-8 text-[var(--foreground)]">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <header className="mb-6 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Link
                href="/categories"
                className="text-sm font-medium underline decoration-[var(--border)] underline-offset-4 hover:decoration-[var(--accent)]"
              >
                ← Back to Categories
              </Link>

              <h1 className={`mt-3 text-4xl font-bold tracking-tight ${headlineClass}`}>
                {displayName}
              </h1>

              <p className="mt-2 text-sm text-[var(--muted)]">
                Total articles: {pagination.total}
              </p>

              {safeCategory.id === 0 ? (
                <p className="mt-2 text-xs text-[var(--muted)]">
                 New stories will appear here soon.
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/"
                className="text-sm font-medium underline decoration-[var(--border)] underline-offset-4 hover:decoration-[var(--accent)]"
              >
                Home →
              </Link>
            </div>
          </div>
        </header>

        {/* 12-col layout (8 main + 4 sidebar) */}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* MAIN */}
          <section className="space-y-8 lg:col-span-8">
            {articles.length === 0 ? (
              <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
                <p className="font-semibold">No articles in this category yet.</p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                   New stories will appear here soon.
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href="/"
                    className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm hover:bg-[var(--surface)]"
                  >
                    ← Back to Home
                  </Link>
                  <Link
                    href="/categories"
                    className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm hover:bg-[var(--surface)]"
                  >
                    View all categories →
                  </Link>
                </div>
              </section>
            ) : (
              <div className="space-y-6">
                {/* Row cards (first 2) */}
                <div className="space-y-6">
                  {articles.slice(0, 2).map((a) => (
                    <CardRow
                      key={a.id}
                      href={`/article/${a.slug}`}
                      title={a.title}
                      excerpt={a.excerpt}
                      coverUrl={a.coverUrl}
                      publishedAt={a.publishedAt}
                      category={
                        safeCategory.slug
                          ? { name: safeCategory.name ?? "Category", slug }
                          : null
                      }
                      author={null}
                    />
                  ))}
                </div>

                {/* Grid cards (next 6) */}
                <div className="grid gap-6 md:grid-cols-2">
                  {articles.slice(2, 8).map((a) => (
                    <StoryCard
                      key={a.id}
                      href={`/article/${a.slug}`}
                      title={a.title}
                      excerpt={a.excerpt}
                      coverUrl={a.coverUrl}
                      publishedAt={a.publishedAt}
                      category={
                        safeCategory.slug
                          ? { name: safeCategory.name ?? "Category", slug }
                          : null
                      }
                      author={null}
                    />
                  ))}
                </div>

                {/* Text-only (next 4) */}
                {articles.slice(8, 12).length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2">
                    {articles.slice(8, 12).map((a) => (
                      <CardTextOnly
                        key={a.id}
                        href={`/article/${a.slug}`}
                        title={a.title}
                        excerpt={a.excerpt}
                        publishedAt={a.publishedAt}
                        category={
                          safeCategory.slug
                            ? { name: safeCategory.name ?? "Category", slug }
                            : null
                        }
                        author={null}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            )}

            {/* Pagination */}
            {pagination.pageCount > 1 ? (
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <Link
                  href={makePageHref(Math.max(1, pagination.page - 1))}
                  className={`rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm ${
                    pagination.page <= 1
                      ? "pointer-events-none opacity-40"
                      : "hover:bg-[var(--surface)]"
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
                        active
                          ? "bg-[var(--brand)] text-white"
                          : "bg-white hover:bg-[var(--surface)]"
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
      </div>
    </main>
  );
}
