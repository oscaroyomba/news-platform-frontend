// frontend/app/sitemap.ts
import type { MetadataRoute } from "next";

const STRAPI_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL ??
  process.env.STRAPI_URL ??
  "http://127.0.0.1:1337";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? "http://localhost:3000";

async function fetchAllArticleSlugs(): Promise<Array<{ slug: string; updatedAt?: string }>> {
  const pageSize = 100;
  let page = 1;

  const all: Array<{ slug: string; updatedAt?: string }> = [];

  while (true) {
    const qp = new URLSearchParams();
    qp.set("fields[0]", "slug");
    qp.set("fields[1]", "updatedAt");
    qp.set("pagination[page]", String(page));
    qp.set("pagination[pageSize]", String(pageSize));

    const url = `${STRAPI_URL}/api/articles?${qp.toString()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) break;

    const json: any = await res.json();
    const data: any[] = json?.data ?? [];

    for (const item of data) {
      const a = item?.attributes ?? item; // v4 vs v5
      if (a?.slug) all.push({ slug: a.slug, updatedAt: a.updatedAt });
    }

    const total = json?.meta?.pagination?.total;
    const pageCount = json?.meta?.pagination?.pageCount;

    if (typeof pageCount === "number") {
      if (page >= pageCount) break;
      page++;
      continue;
    }

    // fallback
    if (typeof total === "number" && all.length >= total) break;
    if (data.length < pageSize) break;

    page++;
  }

  return all;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await fetchAllArticleSlugs();

  const now = new Date().toISOString();

  return [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
    },
    ...articles.map((a) => ({
      url: `${SITE_URL}/article/${encodeURIComponent(a.slug)}`,
      lastModified: a.updatedAt ?? now,
    })),
  ];
}
