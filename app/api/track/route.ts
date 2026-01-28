// frontend/app/api/track/route.ts

import { NextResponse } from "next/server";
import { pool } from "../../../lib/db";

type TrackBody = {
  event_name: string; // required
  path: string; // required
  article_slug?: string | null;

  referrer?: string | null;
  device_type?: string | null;
  session_id?: string | null;

  dwell_ms?: number | null;
  scroll_depth?: number | null;

  extra?: any;
};

function bad(msg: string, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

export async function POST(req: Request) {
  let body: TrackBody | null = null;

  try {
    body = (await req.json()) as TrackBody;
  } catch {
    return bad("Invalid JSON body.");
  }

  const event_name = (body?.event_name ?? "").trim();
  const path = (body?.path ?? "").trim();

  if (!event_name) return bad("event_name is required.");
  if (!path) return bad("path is required.");

  // Grab useful headers
  const user_agent = req.headers.get("user-agent");
  const referrerHeader = req.headers.get("referer");

  const values = [
    event_name,
    path,
    body?.article_slug ?? null,
    body?.referrer ?? referrerHeader ?? null,
    user_agent ?? null,
    body?.device_type ?? null,
    body?.session_id ?? null,
    Number.isFinite(body?.dwell_ms as number) ? Number(body?.dwell_ms) : null,
    Number.isFinite(body?.scroll_depth as number) ? Number(body?.scroll_depth) : null,
    body?.extra ?? null,
  ];

  try {
    const q = `
      INSERT INTO engagement_events (
        event_name, path, article_slug, referrer, user_agent,
        device_type, session_id, dwell_ms, scroll_depth, extra
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING id, created_at
    `;

    const result = await pool.query(q, values);
    const row = result.rows?.[0];

    return NextResponse.json(
      { ok: true, id: row?.id, created_at: row?.created_at },
      { status: 201 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "DB insert failed", detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
