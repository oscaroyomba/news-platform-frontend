import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const STRAPI_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL ??
  process.env.STRAPI_URL ??
  "http://localhost:1337";

export async function GET() {
  // ✅ cookies() is async in your Next.js version
  const cookieStore = await cookies();
  const jwt = cookieStore.get("strapi_jwt")?.value;

  if (!jwt) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const r = await fetch(`${STRAPI_URL}/api/users/me`, {
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
    cache: "no-store",
  });

  if (!r.ok) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const user = await r.json();
  return NextResponse.json({ user }, { status: 200 });
}