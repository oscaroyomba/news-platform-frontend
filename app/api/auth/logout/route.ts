import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  cookies().set("strapi_jwt", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // set true when https
    path: "/",
    maxAge: 0,
  });

  return NextResponse.json({ ok: true });
}