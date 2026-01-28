import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  // FIXED: Use await cookies() for Next.js 16+
  const cookieStore = await cookies();
  cookieStore.set("strapi_jwt", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production", // Auto HTTPS in production
    path: "/",
    maxAge: 0, // Expire immediately
  });

  return NextResponse.json({ ok: true });
}