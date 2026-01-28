// frontend/app/categories/page.tsx

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Browse News Categories | The Groceria Buzz",
  description:
    "Latest Kenyan and African news organized by topic — Business, Technology, Health, Politics and more.",
  openGraph: {
    title: "Browse News Categories",
    description: "Latest Kenyan and African news organized by topic.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Browse News Categories",
    description: "Latest Kenyan and African news organized by topic.",
  },
};

export const dynamic = "force-dynamic";

const STRAPI_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL ??
  process.env.STRAPI_URL ??
  "http://localhost:1337";

// ---------- Types (support Strapi v4 + v5 response shapes) ----------
type StrapiV4Item<T> = { id: number; attributes: T };
type StrapiV5Item<T> = T & { id: number; documentId?: string };
type StrapiListResponse<T> = { data: Array<StrapiV4Item<T> | StrapiV5Item<T>> };

type CategoryFields = {
  name?: string;
  slug?: string;
};

// ---------- Helpers ----------
function normalizeCategory(
  item: StrapiV4Item<CategoryFields> | StrapiV5Item<CategoryFields>
) {
  // v4
  if (item && typeof item === "object" && "attributes" in item) {
    const a = (item as StrapiV4Item<CategoryFields>).attributes ?? {};
    return {
      id: item.id,
      name: a.name ?? "Untitled Category",
      slug: a.slug ?? "",
    };
  }

  // v5
  const a = (item as any) ?? {};
  return { id: a.id, name: a.name ?? "Untitled Category", slug: a.slug ?? "" };
}

async function fetchJson(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  const text = await res.text();

  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // ignore parse error
  }

  return { res, json, text };
}

export default async function CategoriesPage() {
  const url = `${STRAPI_URL}/api/categories?sort=name:asc&populate=*`;

  let res: Response;
  let json: StrapiListResponse<CategoryFields> | null = null;

  try {
    const out = await fetchJson(url);
    res = out.res;
    json = out.json as StrapiListResponse<CategoryFields>;
  } catch {
    return (
      <main className="min-h-screen p-8">
        <Link href="/" className="text-sm opacity-70 hover:opacity-100">
          ← Back to latest
        </Link>

        <h1 className="mt-4 text-3xl font-bold">Categories</h1>

        <p className="mt-4 text-red-400">Fetch failed.</p>
        <p className="mt-2 opacity-80">Check Strapi is running: {STRAPI_URL}</p>
        <p className="mt-2 text-sm opacity-70">URL: {url}</p>
      </main>
    );
  }

  if (!res!.ok) {
    return (
      <main className="min-h-screen p-8">
        <Link href="/" className="text-sm opacity-70 hover:opacity-100">
          ← Back to latest
        </Link>

        <h1 className="mt-4 text-3xl font-bold">Categories</h1>

        <p className="mt-4 text-red-400">
          Failed to load categories: {res!.status} {res!.statusText}
        </p>

        <p className="mt-2 opacity-80">
          Make sure Public role has permission to “find” Categories.
        </p>

        <p className="mt-2 text-sm opacity-70">URL: {url}</p>
      </main>
    );
  }

  const categories = (json?.data ?? [])
    .map(normalizeCategory)
    .filter((c) => c && c.slug);

  return (
    <main className="min-h-screen p-8">
      <header className="mb-8">
        <Link href="/" className="text-sm opacity-70 hover:opacity-100">
          ← Back to latest
        </Link>

        <h1 className="mt-4 text-3xl font-bold">Categories</h1>
        <p className="mt-2 opacity-80">Browse articles by category.</p>
      </header>

      {categories.length === 0 ? (
        <p className="opacity-80">
          No categories yet. Create and publish categories in Strapi.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className="rounded-xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
            >
              <h2 className="text-lg font-semibold">{c.name}</h2>
              <p className="mt-2 text-sm opacity-70">/{c.slug}</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
