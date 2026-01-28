// frontend/app/author/[slug]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

const STRAPI_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL ??
  process.env.STRAPI_URL ??
  "http://localhost:1337";

// ---- Shared types (v4 + v5 safe) ----
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
  | { url?: string; formats?: Record<string, StrapiMediaFormat> }
  | null
  | undefined;

type AuthorFields = {
  name?: string;
  slug?: string;
  bio?: any; // blocks
  publishedAt?: string | null;
  photo?: StrapiMedia;
};

type ArticleFields = {
  title?: string;
  slug?: string;
  excerpt?: string | null;
  publishedAt?: string | null;
  cover_image?: StrapiMedia;
  author?: any; // relation
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  const title = `Author: ${slug}`;
  const description = `Browse articles by ${slug}.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "profile" },
    twitter: { card: "summary", title, description },
  };
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

function normalizeAuthor(item: StrapiV4Item<AuthorFields> | StrapiV5Item<AuthorFields>) {
  if (item && typeof item === "object" && "attributes" in item) {
    const a = (item as any).attributes ?? {};
    return {
      id: item.id,
      name: a.name ?? "Unknown",
      slug: a.slug ?? "",
      bio: a.bio ?? null,
      photoUrl: extractCoverUrl(a.photo),
    };
  }
  const a = (item as any) ?? {};
  return {
    id: a.id,
    name: a.name ?? "Unknown",
    slug: a.slug ?? "",
    bio: a.bio ?? null,
    photoUrl: extractCoverUrl(a.photo),
  };
}

function normalizeArticle(item: StrapiV4Item<ArticleFields> | StrapiV5Item<ArticleFields>) {
  if (item && typeof item === "object" && "attributes" in item) {
    const a = (item as any).attributes ?? {};
    return {
      id: item.id,
      title: a.title ?? "Untitled",
      slug: a.slug ?? "",
      excerpt: a.excerpt ?? null,
      publishedAt: a.publishedAt ?? null,
      coverUrl: extractCoverUrl(a.cover_image),
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
  };
}

// Simple Strapi blocks renderer
function renderBlocks(blocks: any) {
  if (!blocks) return <p className="opacity-80">No bio yet.</p>;
  if (typeof blocks === "string")
    return (
      <p className="whitespace-pre-wrap leading-7 opacity-90">{blocks}</p>
    );
  if (!Array.isArray(blocks)) return <p className="opacity-80">No bio yet.</p>;

  const getText = (node: any): string => {
    if (!node) return "";
    if (typeof node?.text === "string") return node.text;
    if (Array.isArray(node?.children)) return node.children.map(getText).join("");
    return "";
  };

  return (
    <div className="space-y-3">
      {blocks.map((b: any, idx: number) => {
        const type = b?.type;
        const text = (b?.children ?? []).map(getText).join("").trim();
        if (!text) return null;

        if (type === "paragraph") {
          return (
            <p key={idx} className="leading-7 opacity-90">
              {text}
            </p>
          );
        }

        return (
          <p key={idx} className="leading-7 opacity-90">
            {text}
          </p>
        );
      })}
    </div>
  );
}

async function fetchJson(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {}
  return { res, json, text };
}

export default async function AuthorSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // 1) find author by slug
  const authorUrl =
    `${STRAPI_URL}/api/authors` +
    `?filters[slug][$eq]=${encodeURIComponent(slug)}`;

  const out = await fetchJson(authorUrl);

  if (!out.res.ok) {
    return (
      <main className="min-h-screen p-8">
        <Link href="/" className="text-sm opacity-70 hover:opacity-100">
          ← Back to latest
        </Link>
        <p className="mt-4 text-red-400">
          Failed to load author: {out.res.status} {out.res.statusText}
        </p>
        <p className="mt-2 text-sm opacity-70">URL: {authorUrl}</p>
        <pre className="mt-4 whitespace-pre-wrap rounded-lg bg-white/5 p-4 text-xs opacity-80">
{out.text?.slice(0, 800)}
        </pre>
      </main>
    );
  }

  const authorJson = out.json as StrapiListResponse<AuthorFields>;
  const authorItem = authorJson.data?.[0];

  if (!authorItem) {
    return (
      <main className="min-h-screen p-8">
        <Link href="/" className="text-sm opacity-70 hover:opacity-100">
          ← Back to latest
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Author not found</h1>
        <p className="mt-2 opacity-80">No author exists with slug: {slug}</p>
      </main>
    );
  }

  const author = normalizeAuthor(authorItem);

  // 2) fetch articles by this author slug
  // ✅ use populate=* (proved reliable)
  const articlesUrl =
    `${STRAPI_URL}/api/articles` +
    `?filters[author][slug][$eq]=${encodeURIComponent(slug)}` +
    `&populate=*` +
    `&sort=publishedAt:desc` +
    `&pagination[pageSize]=24`;

  let articles: Array<ReturnType<typeof normalizeArticle>> = [];
  let articlesError: string | null = null;

  const out2 = await fetchJson(articlesUrl);
  if (!out2.res.ok) {
    // ✅ don't silently ignore; show error in UI
    articlesError = `${out2.res.status} ${out2.res.statusText}\n${out2.text?.slice(
      0,
      800
    )}`;
  } else {
    const j = out2.json as StrapiListResponse<ArticleFields>;
    articles = (j.data ?? []).map(normalizeArticle).filter((a) => a.slug);
  }

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm opacity-70 hover:opacity-100">
          ← Back to latest
        </Link>
        <Link href="/category" className="text-sm opacity-70 hover:opacity-100">
          Browse categories →
        </Link>
      </div>

      <div className="mt-6 flex items-start gap-4">
        {author.photoUrl ? (
          <div className="relative h-16 w-16 overflow-hidden rounded-full border border-white/10 bg-white/5">
            <Image
              src={author.photoUrl}
              alt={author.name}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs opacity-70">
            No photo
          </div>
        )}

        <div>
          <h1 className="text-3xl font-bold">{author.name}</h1>
          <p className="mt-1 text-sm opacity-60">/author/{author.slug}</p>
        </div>
      </div>

      <section className="mt-6">
        <h2 className="text-lg font-semibold">Bio</h2>
        <div className="mt-3">{renderBlocks(author.bio)}</div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Articles</h2>

        {articlesError ? (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
            <p className="text-sm text-red-200">
              Failed to load articles for this author.
            </p>
            <p className="mt-2 text-xs opacity-80">URL: {articlesUrl}</p>
            <pre className="mt-3 whitespace-pre-wrap text-xs opacity-90">
{articlesError}
            </pre>
          </div>
        ) : articles.length === 0 ? (
          <div className="mt-4">
            <p className="opacity-80">No articles for this author yet.</p>
            <p className="mt-2 text-xs opacity-60">
              Debug URL: <span className="opacity-80">{articlesUrl}</span>
            </p>
          </div>
        ) : (
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <Link
                key={a.id}
                href={`/article/${a.slug}`}
                className="block overflow-hidden rounded-xl border border-white/10 bg-white/5 transition hover:bg-white/10"
              >
                {a.coverUrl ? (
                  <div className="relative aspect-[16/10] w-full">
                    <Image
                      src={a.coverUrl}
                      alt={a.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 33vw"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[16/10] w-full items-center justify-center bg-white/5 text-sm opacity-70">
                    No cover image
                  </div>
                )}

                <div className="p-4">
                  <p className="font-semibold">{a.title}</p>
                  <p className="mt-2 text-sm opacity-80">
                    {a.excerpt ?? "No excerpt yet."}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs opacity-60">/{a.slug}</p>
                    {a.publishedAt ? (
                      <p className="text-xs opacity-60">
                        {new Date(a.publishedAt).toLocaleDateString()}
                      </p>
                    ) : null}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}










