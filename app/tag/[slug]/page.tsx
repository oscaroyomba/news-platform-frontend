// frontend/app/tag/[slug]/page.tsx
import Link from "next/link";
import Image from "next/image";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL ?? "http://localhost:1337";

async function fetchJson(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null } catch {}
  return { res, json, text };
}

export default async function TagSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const tagUrl = `${STRAPI_URL}/api/tags?filters[slug][$eq]=${encodeURIComponent(slug)}`;
  const out = await fetchJson(tagUrl);

  if (!out.res.ok || !out.json?.data?.[0]) {
    return (
      <main className="min-h-screen p-8 max-w-3xl mx-auto">
        <Link href="/" className="text-sm opacity-70 hover:opacity-100">← Back</Link>
        <h1 className="mt-6 text-2xl font-bold">Tag not found</h1>
        <p className="mt-2 opacity-80">No tag exists with slug: {slug}</p>
      </main>
    );
  }

  const tag = out.json.data[0].attributes ?? out.json.data[0];

  const articlesUrl =
    `${STRAPI_URL}/api/articles?filters[tags][slug][$containsi]=${encodeURIComponent(slug)}` +
    `&populate=cover_image,author,tags&sort=publishedAt:desc&pagination[pageSize]=24`;

  const out2 = await fetchJson(articlesUrl);
  const articles = (out2.json?.data ?? []).filter((a: any) => a.slug);

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm opacity-70 hover:opacity-100">← Back</Link>
        <Link href="/category" className="text-sm opacity-70 hover:opacity-100">Browse categories →</Link>
      </div>

      <h1 className="mt-6 text-3xl font-bold">#{tag.name}</h1>

      {articles.length === 0 ? (
        <p className="mt-4 opacity-80">No articles published under this tag yet.</p>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a: any) => {
            const attrs = a.attributes ?? a;
            const coverAttrs = attrs.cover_image?.data?.attributes ?? attrs.cover_image;
            const formats = coverAttrs?.formats ?? null;
            const best = formats?.large ?? formats?.medium ?? formats?.small ?? formats?.thumbnail ?? null;
            const coverUrl = best ? `${STRAPI_URL}${best.url}` : `${STRAPI_URL}${coverAttrs?.url ?? ""}`;

            return (
              <Link
                key={a.id}
                href={`/article/${attrs.slug}`}
                className="block overflow-hidden rounded-xl border border-white/10 bg-white/5 transition hover:bg-white/10"
              >
                {coverUrl ? (
                  <div className="relative aspect-[16/10] w-full">
                    <Image
                      src={coverUrl}
                      alt={attrs.title ?? ""}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[16/10] w-full items-center justify-center bg-white/5 text-sm opacity-70">
                    No cover image
                  </div>
                )}

                <div className="p-4">
                  <h2 className="font-semibold text-lg">{attrs.title}</h2>
                  <p className="mt-2 text-sm opacity-80">{attrs.excerpt ?? "No excerpt yet."}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
