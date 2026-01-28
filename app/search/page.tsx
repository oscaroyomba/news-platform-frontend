// frontend/app/search/page.tsx
import Link from "next/link";
import Image from "next/image";

// Strapi (for building absolute media urls if your Meili docs have relative cover urls)
const STRAPI_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL ?? "http://localhost:1337";

// Meilisearch
const MEILI_URL = process.env.MEILI_URL ?? "http://127.0.0.1:7701";
const MEILI_MASTER_KEY =
  process.env.MEILI_MASTER_KEY ?? "masterKeyForDevOnly";

// ---- Helpers ----
function absoluteUrl(path?: string | null) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  // if it looks like a Strapi upload path
  if (path.startsWith("/uploads")) return `${STRAPI_URL}${path}`;
  return path;
}

function isMissingSlug(v?: string | null) {
  const s = (v ?? "").trim().toLowerCase();
  return !s || s === "(none)" || s === "none" || s === "null" || s === "undefined";
}

function labelOr(v: string | null | undefined, fallback: string) {
  return isMissingSlug(v) ? fallback : String(v).trim();
}

function hrefOr(v: string | null | undefined, fallbackHref: string) {
  return isMissingSlug(v) ? fallbackHref : String(v).trim();
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

// ---- Types (match what your sync-to-meili.js pushed) ----
type MeiliArticle = {
  id?: number;
  title?: string;
  slug?: string;
  excerpt?: string | null;
  publishedAt?: string | null;

  // optional fields if you pushed them
  coverUrl?: string | null;

  category_name?: string | null;
  category_slug?: string | null;

  author_name?: string | null;
  author_slug?: string | null;
};

type MeiliSearchResponse<T> = {
  hits: T[];
  estimatedTotalHits?: number;
  limit?: number;
  offset?: number;
  processingTimeMs?: number;
  query?: string;
};

async function meiliSearch(q: string) {
  const res = await fetch(`${MEILI_URL}/indexes/articles/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MEILI_MASTER_KEY}`,
    },
    body: JSON.stringify({
      q,
      limit: 20,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(
      `Meilisearch failed: ${res.status} ${res.statusText}\n${txt}`
    );
  }

  return (await res.json()) as MeiliSearchResponse<MeiliArticle>;
}

function SearchHeader({
  q,
  total,
  showResultsMeta,
}: {
  q: string;
  total?: number;
  showResultsMeta?: boolean;
}) {
  return (
    <header className="mb-8">
      {/* Guardian-ish masthead strip */}
      <div className="rounded-2xl bg-[var(--brand)] px-5 py-4 text-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium hover:bg-white/15"
            >
              ← Back home
            </Link>
            <span className="hidden h-5 w-px bg-white/20 md:block" />
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Search
            </h1>
          </div>

          {/* Optional “nav-like” quick links (simple + clean) */}
          <div className="flex items-center gap-2 text-xs opacity-90">
            <Link className="hover:underline" href="/category/news">
              News
            </Link>
            <span className="opacity-50">•</span>
            <Link className="hover:underline" href="/category/opinion">
              Opinion
            </Link>
            <span className="opacity-50">•</span>
            <Link className="hover:underline" href="/category/sport">
              Sport
            </Link>
          </div>
        </div>

        {/* Search bar */}
        <form action="/search" method="GET" className="mt-4 flex flex-wrap gap-2">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search articles…"
            className="w-full flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/60 outline-none focus:border-[var(--accent)]"
          />
          <button
            type="submit"
            className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-black hover:opacity-95"
          >
            Search
          </button>

          <Link
            href="/search"
            className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium text-white/90 hover:bg-white/15"
          >
            Clear
          </Link>
        </form>

        {showResultsMeta ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-white/80">
            <p>
              Showing results for <span className="text-white">“{q}”</span> —{" "}
              <span className="text-white">{total ?? 0}</span> found
            </p>
            <p className="hidden md:block">
              Tip: try quotes for exact phrases (e.g. “Nairobi economy”)
            </p>
          </div>
        ) : (
          <p className="mt-3 text-xs text-white/75">
            Tip: try a keyword (e.g. <span className="text-white">Kenya</span>)
            and hit Search.
          </p>
        )}
      </div>
    </header>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const q = typeof sp.q === "string" ? sp.q.trim() : "";

  // Empty state
  if (!q) {
    return (
      <main className="min-h-screen bg-[var(--surface)] px-4 py-8 text-[var(--foreground)]">
        <div className="mx-auto max-w-6xl">
          <SearchHeader q="" showResultsMeta={false} />

          <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Start searching</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Use the search bar above to find articles by title, category, or
              author.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {["Kenya", "Elections", "Business", "Sport", "Technology"].map(
                (term) => (
                  <Link
                    key={term}
                    href={`/search?q=${encodeURIComponent(term)}`}
                    className="inline-flex items-center rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--surface)]"
                  >
                    {term}
                  </Link>
                )
              )}
            </div>
          </section>
        </div>
      </main>
    );
  }

  let data: MeiliSearchResponse<MeiliArticle>;

  try {
    data = await meiliSearch(q);
  } catch (e: any) {
    return (
      <main className="min-h-screen bg-[var(--surface)] px-4 py-8 text-[var(--foreground)]">
        <div className="mx-auto max-w-6xl">
          <SearchHeader q={q} showResultsMeta={false} />

          <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-red-600">Search failed.</p>

            <pre className="mt-3 whitespace-pre-wrap rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-xs text-[var(--foreground)]">
{String(e?.message ?? e)}
            </pre>

            <div className="mt-6 text-sm text-[var(--muted)]">
              <p className="mb-2 font-semibold text-[var(--foreground)]">
                Quick checks:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  Meili is up:{" "}
                  <code className="text-[var(--foreground)]">
                    http://127.0.0.1:7701/health
                  </code>
                </li>
                <li>
                  Index exists:{" "}
                  <code className="text-[var(--foreground)]">/indexes</code>
                </li>
                <li>
                  Key set:{" "}
                  <code className="text-[var(--foreground)]">
                    MEILI_MASTER_KEY
                  </code>{" "}
                  (or fallback{" "}
                  <code className="text-[var(--foreground)]">
                    masterKeyForDevOnly
                  </code>
                  )
                </li>
              </ul>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const hits = data.hits ?? [];
  const total = data.estimatedTotalHits ?? hits.length;

  return (
    <main className="min-h-screen bg-[var(--surface)] px-4 py-8 text-[var(--foreground)]">
      <div className="mx-auto max-w-6xl">
        <SearchHeader q={q} total={total} showResultsMeta />

        {hits.length === 0 ? (
          <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
            <p className="font-semibold">No results.</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Try a different keyword, or shorten the phrase.
            </p>
          </section>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {hits.map((a) => {
              const slug = (a.slug ?? "").trim();
              const hasSlug = !isMissingSlug(slug);
              const cover = absoluteUrl(a.coverUrl ?? "");

              const categoryLabel = labelOr(a.category_name, "Home");
              const categoryHref = `/category/${hrefOr(a.category_slug, "home")}`;
              // If missing category slug, we prefer Home link:
              const safeCategoryHref = isMissingSlug(a.category_slug) ? "/" : categoryHref;

              const authorLabel = labelOr(a.author_name, "Unknown");
              const authorHref = `/author/${hrefOr(a.author_slug, "unknown")}`;
              // If missing author slug, no real author page yet → route back home:
              const safeAuthorHref = isMissingSlug(a.author_slug) ? "/" : authorHref;

              const dateLabel = formatDateShort(a.publishedAt);

              return (
                <article
                  key={`${a.id ?? slug}-${slug || "no-slug"}`}
                  className="group overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  {hasSlug ? (
                    <Link href={`/article/${slug}`} className="block">
                      {cover ? (
                        <div className="relative aspect-[16/10] w-full bg-[var(--surface)]">
                          <Image
                            src={cover}
                            alt={a.title ?? "Article"}
                            fill
                            className="object-cover"
                            sizes="(max-width: 1024px) 100vw, 33vw"
                            unoptimized
                          />
                          {/* subtle top bar accent */}
                          <div className="absolute left-0 top-0 h-1 w-full bg-[var(--accent)]" />
                        </div>
                      ) : (
                        <div className="flex aspect-[16/10] w-full items-center justify-center bg-[var(--surface)] text-sm text-[var(--muted)]">
                          No cover image
                        </div>
                      )}
                    </Link>
                  ) : (
                    <div className="flex aspect-[16/10] w-full items-center justify-center bg-[var(--surface)] text-sm text-[var(--muted)]">
                      No slug (cannot open)
                    </div>
                  )}

                  <div className="p-4">
                    {/* Pills (always show with fallback) */}
                    <div className="mb-3 flex flex-wrap gap-2">
                      <Link
                        href={safeCategoryHref}
                        className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs font-medium text-[var(--foreground)] hover:bg-white"
                      >
                        {categoryLabel}
                      </Link>

                      <Link
                        href={safeAuthorHref}
                        className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs font-medium text-[var(--foreground)] hover:bg-white"
                      >
                        By {authorLabel}
                      </Link>
                    </div>

                    {hasSlug ? (
                      <Link href={`/article/${slug}`} className="block">
                        <h2 className="text-lg font-semibold leading-snug tracking-tight group-hover:underline">
                          {a.title ?? "Untitled"}
                        </h2>

                        <p className="mt-2 line-clamp-3 text-sm text-[var(--muted)]">
                          {a.excerpt ?? "No excerpt yet."}
                        </p>

                        <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--border)] pt-3">
                          <p className="truncate text-xs text-[var(--muted)]">
                            /article/{slug}
                          </p>
                          <p className="text-xs text-[var(--muted)]">
                            {dateLabel || "—"}
                          </p>
                        </div>
                      </Link>
                    ) : (
                      <>
                        <h2 className="text-lg font-semibold leading-snug tracking-tight">
                          {a.title ?? "Untitled"}
                        </h2>

                        <p className="mt-2 line-clamp-3 text-sm text-[var(--muted)]">
                          {a.excerpt ?? "No excerpt yet."}
                        </p>

                        <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--border)] pt-3">
                          <p className="truncate text-xs text-[var(--muted)]">
                            Unknown
                          </p>
                          <p className="text-xs text-[var(--muted)]">
                            {dateLabel || "—"}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}



