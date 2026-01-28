// frontend/app/api/comments/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL ?? "http://localhost:1337";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug") ?? "";

  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  // Find comments by article slug
  const url =
    `${STRAPI_URL}/api/comments?` +
    `populate=author&` +
    `filters[article][slug][$eq]=${encodeURIComponent(slug)}&` +
    `sort=createdAt:desc`;

  const r = await fetch(url, { cache: "no-store" });
  const data = await r.json().catch(() => ({}));

  return NextResponse.json(data, { status: r.status });
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const jwt = cookieStore.get("strapi_jwt")?.value;

  if (!jwt) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const content = String(body.content ?? "").trim();
  const articleId = Number(body.articleId);

  if (!content || !Number.isFinite(articleId) || articleId <= 0) {
    return NextResponse.json(
      { error: "Missing/invalid content or articleId" },
      { status: 400 }
    );
  }

  const r = await fetch(`${STRAPI_URL}/api/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({
      data: {
        content,
        article: articleId,
      },
    }),
  });

  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}











