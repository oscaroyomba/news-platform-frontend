// frontend/app/article/[slug]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import CommentsSection from "@/app/_components/CommentsSection";

import SidebarList, { type SidebarItem } from "../../_components/SidebarList";
import NewsletterCTA from "../../_components/NewsletterCTA";

const STRAPI_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL ??
  process.env.STRAPI_URL ??
  "http://localhost:1337";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.SITE_URL ??
  "http://localhost:3000";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "News Platform";

// ---------- Types (Strapi v4 + v5 friendly) ----------
type StrapiV4Item<T> = { id: number; attributes: T };
type StrapiV5Item<T> = T & { id: number; documentId?: string };

type StrapiListResponse<T> = {
  data: Array<StrapiV4Item<T> | StrapiV5Item<T>>;
  meta?: any;
};

type StrapiMediaFormat = { url: string; width?: number; height?: number };

type StrapiMediaItem =
  | {
      id?: number;
      attributes?: {
        url?: string;
        formats?: Record<string, StrapiMediaFormat>;
        alternativeText?: string | null;
        caption?: string | null;
        width?: number;
        height?: number;
      };
    }
  | {
      id?: number;
      url?: string;
      formats?: Record<string, StrapiMediaFormat>;
      alternativeText?: string | null;
      caption?: string | null;
      width?: number;
      height?: number;
    }
  | null
  | undefined;

type StrapiMediaSingle =
  | {
      data?: StrapiMediaItem | null;
    }
  | StrapiMediaItem
  | null
  | undefined;

type StrapiMediaMany =
  | {
      data?: StrapiMediaItem[] | null;
    }
  | StrapiMediaItem[]
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
  content?: any; // string OR richtext blocks array
  publishedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;

  cover_image?: StrapiMediaSingle;

  // ✅ galleries (existing)
  gallery?: StrapiMediaMany;
  gallery1?: StrapiMediaMany;
  gallery2?: StrapiMediaMany;

  category?: StrapiCategoryRel;
  author?: StrapiAuthorRel;

  // Strapi v4 wrapper sometimes appears
  attributes?: ArticleFields;
};

// ---------- Helpers ----------
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

function normalizeOneMedia(
  item: any
): { url: string; alt: string; caption: string } | null {
  if (!item) return null;

  // v4: { id, attributes: {...} }
  const v4Attrs = item?.attributes;
  if (v4Attrs) {
    const best = pickBestFromFormats(v4Attrs.formats);
    return {
      url: absoluteUrl(best?.url ?? v4Attrs.url ?? ""),
      alt: (v4Attrs.alternativeText ?? "") as string,
      caption: (v4Attrs.caption ?? "") as string,
    };
  }

  // v5: { url, formats, alternativeText, caption }
  const best = pickBestFromFormats(item?.formats);
  return {
    url: absoluteUrl(best?.url ?? item?.url ?? ""),
    alt: (item?.alternativeText ?? "") as string,
    caption: (item?.caption ?? "") as string,
  };
}

function extractCover(
  cover: StrapiMediaSingle
): { url: string; alt: string; caption: string } {
  if (!cover) return { url: "", alt: "", caption: "" };

  // v4 style wrapper
  const maybeData = (cover as any)?.data;
  if (maybeData) {
    const normalized = normalizeOneMedia(maybeData);
    return normalized ?? { url: "", alt: "", caption: "" };
  }

  // v5 direct
  const normalized = normalizeOneMedia(cover);
  return normalized ?? { url: "", alt: "", caption: "" };
}

function extractGallery(
  gallery: StrapiMediaMany
): Array<{ url: string; alt: string; caption: string }> {
  if (!gallery) return [];

  // v4: { data: [...] }
  const v4Data = (gallery as any)?.data;
  if (Array.isArray(v4Data)) {
    return v4Data.map(normalizeOneMedia).filter(Boolean) as any;
  }

  // v5: [...]
  if (Array.isArray(gallery)) {
    return gallery.map(normalizeOneMedia).filter(Boolean) as any;
  }

  return [];
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
    return {
      id: (candidate as any).id,
      name: a.name ?? "Unknown",
      slug: a.slug ?? "",
    };
  }

  const a = (candidate as any) ?? {};
  return { id: a.id, name: a.name ?? "Unknown", slug: a.slug ?? "" };
}

function normalizeArticle(
  item: StrapiV4Item<ArticleFields> | StrapiV5Item<ArticleFields>
) {
  const isV4 = item && typeof item === "object" && "attributes" in item;
  const a = (isV4 ? (item as any).attributes : item) ?? {};

  const cover = extractCover(a.cover_image);

  // ✅ Prefer gallery2 -> gallery1 -> gallery
  const gallery = extractGallery(a.gallery2 ?? a.gallery1 ?? a.gallery);

  return {
    id: (item as any).id as number,
    title: a.title ?? "Untitled",
    slug: a.slug ?? "",
    excerpt: a.excerpt ?? null,
    content: a.content ?? null,
    publishedAt: a.publishedAt ?? null,
    coverUrl: cover.url,
    coverAlt: cover.alt,
    coverCaption: cover.caption, // media caption -> courtesy
    gallery,
    category: normalizeCategory(a.category),
    author: normalizeAuthor(a.author),
  };
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

function toSidebarItem(a: any): SidebarItem {
  const date = formatDateShort(a.publishedAt);
  const cat = a.category?.name ? a.category.name : "";
  const meta = [date, cat].filter(Boolean).join(" • ");
  return { href: `/article/${a.slug}`, title: a.title, meta: meta || null };
}

// ---------- Courtesy helper (prevents "Courtesy: Courtesy: ...") ----------
function courtesyText(raw?: string | null) {
  return (raw ?? "").trim().replace(/^Courtesy:\s*/i, "");
}

// ---------- Inline Figure Renderer ----------
function renderInlineFigure(
  img: { url: string; alt: string; caption: string },
  key: string | number
) {
  const courtesy = courtesyText(img.caption);

  return (
    <figure
      key={key}
      className="my-6 overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={img.url}
        alt={img.alt || "Article image"}
        className="h-auto w-full"
      />

      {/* ✅ Courtesy line (always shows) */}
      <figcaption className="px-4 py-2 text-xs text-[var(--muted)]">
        <span className="font-semibold">Courtesy:</span>{" "}
        {courtesy ? courtesy : "—"}
      </figcaption>
    </figure>
  );
}

// Render Strapi content (string OR blocks) + embed gallery placeholders
// ✅ IMPORTANT: this is now TRUE 1-based: [[img:1]] -> first image, no “-1” logic.
function renderContent(
  content: any,
  gallery: Array<{ url: string; alt: string; caption: string }>
) {
  if (!content) return { node: null as any, used: new Set<number>() };

  // ✅ used stores 1-based image numbers (1,2,3...)
  const used = new Set<number>();

  // ✅ Create a 1-based gallery: gallery1[1] is first image
  const gallery1 = [null as any, ...gallery];

  // ---- Inline formatting helpers (Highlight + Bold + Italic) ----
  const renderBoldItalic = (text: string) => {
    const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);

    return tokens
      .filter((t) => t !== "")
      .map((tok, i) => {
        if (tok.startsWith("**") && tok.endsWith("**") && tok.length >= 4) {
          const inner = tok.slice(2, -2);
          return <strong key={`b-${i}`}>{inner}</strong>;
        }
        if (tok.startsWith("*") && tok.endsWith("*") && tok.length >= 2) {
          const inner = tok.slice(1, -1);
          return <em key={`i-${i}`}>{inner}</em>;
        }
        return <span key={`t-${i}`}>{tok}</span>;
      });
  };

  const renderInline = (text: string) => {
    const parts = text.split(/(==.*?==)/g);
    return parts
      .filter((p) => p !== "")
      .map((part, i) => {
        const isHighlight = part.startsWith("==") && part.endsWith("==");
        if (!isHighlight)
          return <span key={`n-${i}`}>{renderBoldItalic(part)}</span>;

        const cleaned = part.replace(/^==\s?/, "").replace(/\s?==$/, "");
        return <mark key={`m-${i}`}>{renderBoldItalic(cleaned)}</mark>;
      });
  };

  // ✅ detect [[img:N]] placeholder (N is 1-based)
  const matchImgPlaceholder = (line: string) => {
    const m = line.match(/^\[\[\s*img\s*:\s*(\d+)\s*\]\]$/i);
    if (!m) return null;
    return Number(m[1]); // 1-based number
  };

  // bullet: "- item" or "* item"
  const matchBullet = (line: string) => {
    const m = line.match(/^[-*]\s+(.+)$/);
    return m ? m[1] : null;
  };

  // numbered: "1. item"
  const matchNumbered = (line: string) => {
    const m = line.match(/^\d+\.\s+(.+)$/);
    return m ? m[1] : null;
  };

  // ✅ helper: use 1-based index directly (NO -1)
  const getGalleryImage = (imgIndex1: number) => {
    if (imgIndex1 <= 0) return null;
    return gallery1[imgIndex1] ?? null;
  };

  // ---------- string mode ----------
  if (typeof content === "string") {
    const lines = content
      .split("\n")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // ✅ [[img:N]] (1-based, direct)
      const imgIndex1 = matchImgPlaceholder(line);
      if (imgIndex1 !== null) {
        const img = getGalleryImage(imgIndex1);
        if (img) {
          used.add(imgIndex1);
          elements.push(renderInlineFigure(img, `inline-img-${i}-${imgIndex1}`));
        }
        i += 1;
        continue;
      }

      // Heading
      if (line.startsWith("## ")) {
        elements.push(
          <h2 key={`h-${i}`} className="article-subhead">
            {line.replace(/^##\s+/, "")}
          </h2>
        );
        i += 1;
        continue;
      }

      // Bullet list (group consecutive bullets)
      const b = matchBullet(line);
      if (b !== null) {
        const items: string[] = [];
        while (i < lines.length) {
          const t = matchBullet(lines[i]);
          if (t === null) break;
          items.push(t);
          i += 1;
        }

        elements.push(
          <ul
            key={`ul-${i}`}
            className="my-2 list-disc pl-6 leading-relaxed text-[var(--foreground)]"
          >
            {items.map((it, idx) => (
              <li key={idx}>{renderInline(it)}</li>
            ))}
          </ul>
        );
        continue;
      }

      // Numbered list (group consecutive numbered lines)
      const n = matchNumbered(line);
      if (n !== null) {
        const items: string[] = [];
        while (i < lines.length) {
          const t = matchNumbered(lines[i]);
          if (t === null) break;
          items.push(t);
          i += 1;
        }

        elements.push(
          <ol
            key={`ol-${i}`}
            className="my-2 list-decimal pl-6 leading-relaxed text-[var(--foreground)]"
          >
            {items.map((it, idx) => (
              <li key={idx}>{renderInline(it)}</li>
            ))}
          </ol>
        );
        continue;
      }

      // Paragraph
      elements.push(
        <p key={`p-${i}`} className="leading-relaxed text-[var(--foreground)]">
          {renderInline(line)}
        </p>
      );
      i += 1;
    }

    const node = <div className="space-y-4">{elements}</div>;
    return { node, used };
  }

  // ---------- blocks mode ----------
  if (Array.isArray(content)) {
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < content.length) {
      const block: any = content[i];
      const type = block?.type ?? "paragraph";

      const text = Array.isArray(block?.children)
        ? block.children.map((c: any) => c?.text ?? "").join("")
        : block?.text ?? "";

      const t = (text ?? "").replace(/[\u200B\uFEFF]/g, "").trim();
      if (!t) {
        i += 1;
        continue;
      }

      // ✅ [[img:N]] (1-based, direct)
      const imgIndex1 = matchImgPlaceholder(t);
      if (imgIndex1 !== null) {
        const img = getGalleryImage(imgIndex1);
        if (img) {
          used.add(imgIndex1);
          elements.push(renderInlineFigure(img, `inline-img-${i}-${imgIndex1}`));
        }
        i += 1;
        continue;
      }

      // Headings (Strapi blocks + markdown-typed)
      if (
        type === "heading" ||
        type === "heading-one" ||
        type === "headingTwo" ||
        t.startsWith("## ")
      ) {
        elements.push(
          <h2 key={`hb-${i}`} className="article-subhead">
            {t.startsWith("## ") ? t.replace(/^##\s+/, "") : t}
          </h2>
        );
        i += 1;
        continue;
      }

      // Bullet list in blocks mode (if user typed "- item" per block)
      const b = matchBullet(t);
      if (b !== null) {
        const items: string[] = [];
        while (i < content.length) {
          const blk: any = content[i];
          const txt = Array.isArray(blk?.children)
            ? blk.children.map((c: any) => c?.text ?? "").join("")
            : blk?.text ?? "";
          const tt = (txt ?? "").replace(/[\u200B\uFEFF]/g, "").trim();
          const one = matchBullet(tt);
          if (one === null) break;
          items.push(one);
          i += 1;
        }

        elements.push(
          <ul
            key={`ulb-${i}`}
            className="my-2 list-disc pl-6 leading-relaxed text-[var(--foreground)]"
          >
            {items.map((it, idx) => (
              <li key={idx}>{renderInline(it)}</li>
            ))}
          </ul>
        );
        continue;
      }

      // Numbered list in blocks mode ("1. item" per block)
      const n = matchNumbered(t);
      if (n !== null) {
        const items: string[] = [];
        while (i < content.length) {
          const blk: any = content[i];
          const txt = Array.isArray(blk?.children)
            ? blk.children.map((c: any) => c?.text ?? "").join("")
            : blk?.text ?? "";
          const tt = (txt ?? "").replace(/[\u200B\uFEFF]/g, "").trim();
          const one = matchNumbered(tt);
          if (one === null) break;
          items.push(one);
          i += 1;
        }

        elements.push(
          <ol
            key={`olb-${i}`}
            className="my-2 list-decimal pl-6 leading-relaxed text-[var(--foreground)]"
          >
            {items.map((it, idx) => (
              <li key={idx}>{renderInline(it)}</li>
            ))}
          </ol>
        );
        continue;
      }

      // Paragraph
      elements.push(
        <p key={`pb-${i}`} className="leading-relaxed text-[var(--foreground)]">
          {renderInline(t)}
        </p>
      );
      i += 1;
    }

    const node = <div className="space-y-4">{elements}</div>;
    return { node, used };
  }

  return { node: null as any, used };
}

// Remaining images (if you forgot to embed some)
// ✅ Now matches 1-based used set
function renderRemainingPhotos(
  gallery: Array<{ url: string; alt: string; caption: string }>,
  used: Set<number>
) {
  const remaining = gallery
    .map((img, i) => ({ img, i })) // i is 0-based
    .filter(({ i }) => !used.has(i + 1)); // ✅ compare with 1-based

  if (!remaining.length) return null;

  return (
    <section className="mt-8 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
      <h2 className="font-[var(--font-serif)] text-2xl font-bold tracking-tight text-[var(--article-brown)]">
        More photos
      </h2>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {remaining.map(({ img, i }) => {
          const courtesy = courtesyText(img.caption);

          return (
            <figure
              key={i}
              className="overflow-hidden rounded-xl border border-[var(--border)] bg-white"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.alt || `Photo ${i + 1}`}
                className="h-auto w-full"
              />

              {/* ✅ Courtesy line (always shows) */}
              <figcaption className="px-4 py-2 text-xs text-[var(--muted)]">
                <span className="font-semibold">Courtesy:</span>{" "}
                {courtesy ? courtesy : "—"}
              </figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}

// ---------- Data fetch ----------
async function fetchOneBySlug(slug: string) {
  const qp = new URLSearchParams();
  qp.set("populate", "*");
  qp.set("filters[slug][$eq]", slug);
  qp.set("pagination[pageSize]", "1");

  const url = `${STRAPI_URL}/api/articles?${qp.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;

  const json = (await res.json()) as StrapiListResponse<ArticleFields>;
  const first = (json?.data ?? [])[0];
  return first ? normalizeArticle(first as any) : null;
}

async function fetchLatest(limit = 15) {
  const qp = new URLSearchParams();
  qp.set("populate", "*");
  qp.set("sort", "publishedAt:desc");
  qp.set("pagination[pageSize]", String(limit));

  const url = `${STRAPI_URL}/api/articles?${qp.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];

  const json = (await res.json()) as StrapiListResponse<ArticleFields>;
  return (json?.data ?? []).map(normalizeArticle).filter((a) => a && a.slug);
}

async function fetchRelated(
  categorySlug: string | null,
  excludeSlug: string,
  limit = 6
) {
  if (!categorySlug) return [];

  const qp = new URLSearchParams();
  qp.set("populate", "*");
  qp.set("sort", "publishedAt:desc");
  qp.set("pagination[pageSize]", String(limit));
  qp.set("filters[category][slug][$eq]", categorySlug);
  qp.set("filters[slug][$ne]", excludeSlug);

  const url = `${STRAPI_URL}/api/articles?${qp.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];

  const json = (await res.json()) as StrapiListResponse<ArticleFields>;
  return (json?.data ?? []).map(normalizeArticle).filter((a) => a && a.slug);
}

// ---------- Page ----------
export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const article = await fetchOneBySlug(slug);
  if (!article) return notFound();

  const latest = await fetchLatest(15);

  const latestItems = latest.slice(0, 5).map(toSidebarItem);
  const mostPopularItems = latest.slice(5, 10).map(toSidebarItem);
  const mostReadItems = latest.slice(10, 15).map(toSidebarItem);

  const related = await fetchRelated(
    article.category?.slug ?? null,
    article.slug,
    6
  );
  const date = formatDateShort(article.publishedAt);

  const rendered = renderContent(article.content, article.gallery);
  const used = rendered.used;

  const coverCourtesy = courtesyText(article.coverCaption);

  return (
    <main className="min-h-screen bg-[var(--surface)] px-4 py-8 text-[var(--foreground)]">
      <div className="mx-auto max-w-6xl">
        {/* Breadcrumb */}
        <nav className="mb-4 text-sm text-[var(--muted)]">
          <Link
            href="/"
            className="underline decoration-[var(--border)] underline-offset-4 hover:decoration-[var(--accent)]"
          >
            Home
          </Link>
          <span> / </span>
          {article.category?.slug ? (
            <>
              <Link
                href={`/category/${article.category.slug}`}
                className="underline decoration-[var(--border)] underline-offset-4 hover:decoration-[var(--accent)]"
              >
                {article.category.name}
              </Link>
              <span> / </span>
            </>
          ) : null}
          <span className="text-[var(--foreground)]">{article.title}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* MAIN */}
          <article className="lg:col-span-8">
            {/* Title block */}
            <header className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
              {article.category?.slug ? (
                <Link
                  href={`/category/${article.category.slug}`}
                  className="inline-flex items-center rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-bold text-black"
                >
                  {article.category.name}
                </Link>
              ) : null}

              <h1 className="mt-3 font-[var(--font-serif)] text-4xl font-extrabold leading-tight tracking-tight text-[var(--foreground)]">
                {article.title}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--muted)]">
                {article.author?.slug ? (
                  <Link
                    href={`/author/${article.author.slug}`}
                    className="font-medium underline decoration-[var(--border)] underline-offset-4 hover:decoration-[var(--accent)]"
                  >
                    {article.author.name}
                  </Link>
                ) : (
                  <span className="font-medium">
                    {article.author?.name ?? "Unknown"}
                  </span>
                )}
                <span>•</span>
                <span>{date || "—"}</span>
              </div>

              {article.excerpt ? (
                <p className="mt-4 text-lg leading-relaxed text-[var(--foreground)]/90">
                  {article.excerpt}
                </p>
              ) : null}
            </header>

            {/* Hero image */}
            {article.coverUrl ? (
              <figure className="mt-6 overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={article.coverUrl}
                  alt={article.coverAlt || article.title}
                  className="h-auto w-full"
                />
                <div className="h-1 w-full bg-[var(--accent)]" />

                {/* ✅ Courtesy line (always shows) */}
                <figcaption className="px-5 py-3 text-xs text-[var(--muted)]">
                  <span className="font-semibold">Courtesy:</span>{" "}
                  {coverCourtesy ? coverCourtesy : "—"}
                </figcaption>
              </figure>
            ) : null}

            {/* Content (embeds images with [[img:N]]) */}
            <section className="article-body prose prose-neutral mt-6 max-w-none rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
              {rendered.node ?? (
                <p className="text-[var(--muted)]">
                  No content yet. Add body content in Strapi.
                </p>
              )}
            </section>

            {/* If you forgot to embed some images, show the leftovers here */}
            {renderRemainingPhotos(article.gallery, used)}

            {/* Comments */}
            <section className="mt-8 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
              <h2 className="font-[var(--font-serif)] text-2xl font-bold tracking-tight text-[var(--article-brown)]">
                Comments
              </h2>
              <div className="mt-4">
                <CommentsSection articleId={article.id} />
              </div>
            </section>

            {/* Related articles */}
            <section className="mt-8 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
              <h2 className="font-[var(--font-serif)] text-2xl font-bold tracking-tight text-[var(--article-brown)]">
                Related articles
              </h2>

              {related.length ? (
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {related.map((r) => (
                    <Link
                      key={r.id}
                      href={`/article/${r.slug}`}
                      className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 hover:bg-white"
                    >
                      <p className="text-sm font-semibold text-[var(--foreground)] group-hover:underline decoration-[var(--accent)] underline-offset-4">
                        {r.title}
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {formatDateShort(r.publishedAt) || "—"}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-[var(--muted)]">
                  No related articles yet.
                </p>
              )}
            </section>
          </article>

          {/* SIDEBAR */}
          <aside className="space-y-6 lg:col-span-4">
            <SidebarList title="Most popular" items={mostPopularItems} />
            <SidebarList title="Latest" items={latestItems} />
            <SidebarList title="Most read" items={mostReadItems} />
            <NewsletterCTA />
          </aside>
        </div>

        <footer className="mt-12 border-t border-[var(--border)] pt-6 text-sm text-[var(--muted)]">
          <div className="flex items-center justify-between gap-3">
            <span>{SITE_NAME}</span>
            <span className="text-xs">
              © {new Date().getFullYear()} • {SITE_URL}
            </span>
          </div>
        </footer>
      </div>
    </main>
  );
}