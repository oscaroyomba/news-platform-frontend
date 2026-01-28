import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL ?? "http://localhost:1337";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const identifier = String(body.identifier ?? body.email ?? body.username ?? "");
  const password = String(body.password ?? "");

  if (!identifier || !password) {
    return NextResponse.json(
      { error: "Missing identifier/password" },
      { status: 400 }
    );
  }

  const r = await fetch(`${STRAPI_URL}/api/auth/local`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // Strapi expects { identifier, password }
    body: JSON.stringify({ identifier, password }),
  });

  const data = await r.json().catch(() => ({}));

  if (!r.ok) {
    return NextResponse.json(
      { error: data?.error?.message ?? data?.message ?? "Login failed" },
      { status: r.status }
    );
  }

  const jwt = data?.jwt;
  const user = data?.user;

  if (!jwt) {
    return NextResponse.json({ error: "No jwt returned" }, { status: 500 });
  }

  cookies().set("strapi_jwt", jwt, {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // set true when you go https
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return NextResponse.json({ ok: true, user });
}
