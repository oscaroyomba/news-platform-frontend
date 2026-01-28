// frontend/app/sync-meili-articles.js

const STRAPI = "http://localhost:1337";
const MEILI = "http://127.0.0.1:7701";
const MEILI_KEY = "masterKeyForDevOnly"; // change if needed

function absoluteUrl(path) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/")) return `${STRAPI}${path}`;
  return path;
}

function pickBestFromFormats(formats) {
  if (!formats || typeof formats !== "object") return null;
  return formats.large ?? formats.medium ?? formats.small ?? formats.thumbnail ?? null;
}

function extractCoverUrl(media) {
  if (!media) return "";

  // Some Strapi shapes wrap media in { data: ... }
  const m = media?.data ?? media;

  // v4 media item: { id, attributes: { url, formats } }
  if (m && typeof m === "object" && "attributes" in m) {
    const a = m.attributes ?? {};
    const best = pickBestFromFormats(a.formats);
    return absoluteUrl(best?.url ?? a.url ?? "");
  }

  // v5 media item: { url, formats }
  const best = pickBestFromFormats(m?.formats);
  return absoluteUrl(best?.url ?? m?.url ?? "");
}

function normalizeRel(rel) {
  if (!rel) return null;
  const candidate = rel?.data ?? rel;

  // v4 relation: { id, attributes: {...} }
  if (candidate && typeof candidate === "object" && "attributes" in candidate) {
    const a = candidate.attributes ?? {};
    return { id: candidate.id, name: a.name ?? "", slug: a.slug ?? "" };
  }

  // v5 relation: { id, name, slug }
  return {
    id: candidate?.id,
    name: candidate?.name ?? "",
    slug: candidate?.slug ?? "",
  };
}

async function getAllArticles() {
  let page = 1;
  const pageSize = 100;
  const out = [];

  while (true) {
    const url = `${STRAPI}/api/articles?populate=*&pagination[page]=${page}&pagination[pageSize]=${pageSize}`;
    const res = await fetch(url);

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`Strapi fetch failed ${res.status} ${res.statusText}\n${txt}`);
    }

    const json = await res.json();
    const rows = json.data ?? [];

    for (const item of rows) {
      const id = item.id;
      const a = item.attributes ?? item;

      const category = normalizeRel(a.category);
      const author = normalizeRel(a.author);

      // cover field could be named differently depending on your model
      const coverMedia =
        a.cover_image ?? a.coverImage ?? a.cover ?? a.image ?? a.thumbnail ?? null;

      out.push({
        id,
        title: a.title ?? "",
        slug: a.slug ?? "",
        excerpt: a.excerpt ?? "",
        content: a.content ?? "",
        publishedAt: a.publishedAt ?? a.published_at ?? null,

        // ✅ cover image used by /search + cards
        coverUrl: extractCoverUrl(coverMedia) || null,

        // ✅ pills used by /search
        category_name: category?.name ?? null,
        category_slug: category?.slug ?? null,
        author_name: author?.name ?? null,
        author_slug: author?.slug ?? null,
      });
    }

    const pg = json.meta?.pagination;
    if (!pg || page >= pg.pageCount) break;
    page++;
  }

  return out;
}

async function main() {
  console.log("Fetching articles from Strapi...");
  const articles = await getAllArticles();
  console.log("Articles fetched:", articles.length);

  console.log("Sending documents to Meilisearch...");
  const res = await fetch(`${MEILI}/indexes/articles/documents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MEILI_KEY}`,
    },
    body: JSON.stringify(articles),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Meili documents push failed ${res.status} ${res.statusText}\n${txt}`);
  }

  const json = await res.json();
  console.log("Meili task:", json);

  const taskUid = json.taskUid ?? json.uid;
  if (taskUid == null) return;

  console.log("Waiting for Meili task to complete:", taskUid);
  while (true) {
    const r = await fetch(`${MEILI}/tasks/${taskUid}`, {
      headers: { Authorization: `Bearer ${MEILI_KEY}` },
    });
    const t = await r.json();

    if (t.status === "succeeded" || t.status === "failed") {
      console.log("Task status:", t.status);
      console.log(t);
      break;
    }
    await new Promise((x) => setTimeout(x, 500));
  }
}





