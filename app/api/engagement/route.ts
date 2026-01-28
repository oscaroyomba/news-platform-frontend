import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  host: process.env.POSTGRES_HOST ?? "127.0.0.1",
  port: Number(process.env.POSTGRES_PORT ?? "5433"),
  database: process.env.POSTGRES_DB ?? "newsdb",
  user: process.env.POSTGRES_USER ?? "news",
  password: process.env.POSTGRES_PASSWORD ?? "news_password",
});

type EngagementPayload = {
  event_name: string;     // "page_view" | "scroll" | "time_on_page"
  path: string;           // "/article/some-slug" or "/"
  article_slug?: string | null;

  referrer?: string | null;
  user_agent?: string | null;
  device_type?: string | null; // "mobile" | "desktop" etc
  session_id?: string | null;

  dwell_ms?: number | null;
  scroll_depth?: number | null; // 0-100
  extra?: any;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as EngagementPayload;

    if (!body?.event_name || !body?.path) {
      return NextResponse.json(
        { ok: false, error: "event_name and path are required" },
        { status: 400 }
      );
    }

    const sql = `
      INSERT INTO engagement_events
        (event_name, path, article_slug, referrer, user_agent, device_type, session_id, dwell_ms, scroll_depth, extra)
      VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING id
    `;

    const values = [
      body.event_name,
      body.path,
      body.article_slug ?? null,
      body.referrer ?? null,
      body.user_agent ?? null,
      body.device_type ?? null,
      body.session_id ?? null,
      body.dwell_ms ?? null,
      body.scroll_depth ?? null,
      body.extra ?? null,
    ];

    const result = await pool.query(sql, values);

    return NextResponse.json({ ok: true, id: result.rows[0]?.id }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}











