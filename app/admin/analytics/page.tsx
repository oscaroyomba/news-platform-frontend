// frontend/app/admin/analytics/page.tsx
import { pool } from "@/lib/db";

export const dynamic = "force-dynamic"; // no caching in Next.js
export const revalidate = 0;

type DayPoint = { day: string; views: number };

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatMs(ms: number | null | undefined) {
  if (!ms || !Number.isFinite(ms)) return "—";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)} s`;
  const m = s / 60;
  return `${m.toFixed(1)} min`;
}

function formatPct(n: number | null | undefined) {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return `${Math.round(n)}%`;
}

function SvgLineChart({
  data,
  height = 120,
}: {
  data: DayPoint[];
  height?: number;
}) {
  const width = 700;
  const pad = 12;

  if (!data.length) {
    return (
      <div className="rounded-xl border border-white/10 p-4 opacity-70">
        No data yet.
      </div>
    );
  }

  const maxY = Math.max(...data.map((d) => d.views), 1);
  const minY = 0;

  const xStep =
    data.length <= 1 ? 0 : (width - pad * 2) / (data.length - 1);

  const points = data
    .map((d, i) => {
      const x = pad + i * xStep;
      const t = (d.views - minY) / (maxY - minY || 1);
      const y = pad + (1 - t) * (height - pad * 2);
      return `${x},${y}`;
    })
    .join(" ");

  // show a few labels (start/middle/end)
  const startLabel = data[0]?.day ?? "";
  const midLabel = data[Math.floor(data.length / 2)]?.day ?? "";
  const endLabel = data[data.length - 1]?.day ?? "";

  return (
    <div className="rounded-xl border border-white/10 p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-medium">Views (last 30 days)</div>
        <div className="text-xs opacity-70">max/day: {maxY}</div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[140px] w-full"
        role="img"
        aria-label="Views line chart"
      >
        {/* baseline */}
        <line
          x1={pad}
          y1={height - pad}
          x2={width - pad}
          y2={height - pad}
          stroke="currentColor"
          opacity="0.15"
        />

        {/* line */}
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          opacity="0.9"
          points={points}
        />

        {/* dots */}
        {data.map((d, i) => {
          const x = pad + i * xStep;
          const t = (d.views - minY) / (maxY - minY || 1);
          const y = pad + (1 - t) * (height - pad * 2);
          return (
            <circle
              key={d.day}
              cx={x}
              cy={y}
              r={2.5}
              fill="currentColor"
              opacity={0.9}
            />
          );
        })}
      </svg>

      <div className="mt-2 flex justify-between text-xs opacity-70">
        <span>{startLabel}</span>
        <span>{midLabel}</span>
        <span>{endLabel}</span>
      </div>
    </div>
  );
}

async function getDashboardData() {
  // 1) KPI (last 30 days)
  const kpiSql = `
    SELECT
      COUNT(*) FILTER (WHERE event_name = 'page_view')::int AS views_30d,
      COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'page_view')::int AS sessions_30d,
      AVG(dwell_ms) FILTER (WHERE event_name = 'page_view' AND dwell_ms IS NOT NULL)::float AS avg_dwell_ms_30d,
      AVG(scroll_depth) FILTER (WHERE event_name = 'page_view' AND scroll_depth IS NOT NULL)::float AS avg_scroll_30d
    FROM engagement_events
    WHERE created_at >= NOW() - INTERVAL '30 days'
  `;

  // 2) Time series (last 30 days) - one row per day
  const seriesSql = `
    WITH days AS (
      SELECT generate_series(
        date_trunc('day', NOW()) - INTERVAL '29 days',
        date_trunc('day', NOW()),
        INTERVAL '1 day'
      ) AS day
    )
    SELECT
      to_char(d.day, 'YYYY-MM-DD') AS day,
      COALESCE(COUNT(e.*) FILTER (WHERE e.event_name = 'page_view'), 0)::int AS views
    FROM days d
    LEFT JOIN engagement_events e
      ON date_trunc('day', e.created_at) = d.day
     AND e.created_at >= NOW() - INTERVAL '30 days'
    GROUP BY d.day
    ORDER BY d.day ASC
  `;

  // 3) Top articles (last 30 days)
  const topSql = `
    SELECT
      COALESCE(article_slug, '(none)') AS article_slug,
      COUNT(*)::int AS views,
      AVG(dwell_ms) FILTER (WHERE dwell_ms IS NOT NULL)::float AS avg_dwell_ms,
      AVG(scroll_depth) FILTER (WHERE scroll_depth IS NOT NULL)::float AS avg_scroll
    FROM engagement_events
    WHERE created_at >= NOW() - INTERVAL '30 days'
      AND event_name = 'page_view'
    GROUP BY article_slug
    ORDER BY views DESC
    LIMIT 15
  `;

  const [kpiRes, seriesRes, topRes] = await Promise.all([
    pool.query(kpiSql),
    pool.query(seriesSql),
    pool.query(topSql),
  ]);

  const kpiRow = kpiRes.rows?.[0] ?? {};

  const kpis = {
    views30d: Number(kpiRow.views_30d ?? 0),
    sessions30d: Number(kpiRow.sessions_30d ?? 0),
    avgDwellMs30d:
      kpiRow.avg_dwell_ms_30d === null ? null : Number(kpiRow.avg_dwell_ms_30d),
    avgScroll30d:
      kpiRow.avg_scroll_30d === null ? null : Number(kpiRow.avg_scroll_30d),
  };

  const series: DayPoint[] = (seriesRes.rows ?? []).map((r: any) => ({
    day: String(r.day),
    views: Number(r.views ?? 0),
  }));

  const top = (topRes.rows ?? []).map((r: any) => ({
    article_slug: String(r.article_slug ?? ""),
    views: Number(r.views ?? 0),
    avg_dwell_ms: r.avg_dwell_ms === null ? null : Number(r.avg_dwell_ms),
    avg_scroll: r.avg_scroll === null ? null : Number(r.avg_scroll),
  }));

  return { kpis, series, top };
}

function Card({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 p-4">
      <div className="text-xs opacity-70">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {sub ? <div className="mt-1 text-xs opacity-60">{sub}</div> : null}
    </div>
  );
}

export default async function AdminAnalyticsPage() {
  const { kpis, series, top } = await getDashboardData();

  const avgScroll = kpis.avgScroll30d === null ? null : clamp(kpis.avgScroll30d, 0, 100);

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <p className="mt-1 text-sm opacity-70">
          Data source: <code>engagement_events</code> (last 30 days)
        </p>
      </header>

      {/* KPI cards */}
      <section className="grid gap-4 md:grid-cols-4">
        <Card label="Views (30d)" value={String(kpis.views30d)} />
        <Card label="Unique sessions (30d)" value={String(kpis.sessions30d)} />
        <Card
          label="Avg dwell (30d)"
          value={formatMs(kpis.avgDwellMs30d)}
          sub="Only events with dwell_ms"
        />
        <Card
          label="Avg scroll (30d)"
          value={formatPct(avgScroll)}
          sub="Only events with scroll_depth"
        />
      </section>

      {/* Chart + table */}
      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <SvgLineChart data={series} />

        <div className="rounded-xl border border-white/10 p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-medium">Top articles (30 days)</div>
            <div className="text-xs opacity-70">Top {top.length}</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/10 text-left opacity-70">
                <tr>
                  <th className="py-2 pr-3">Slug</th>
                  <th className="py-2 pr-3">Views</th>
                  <th className="py-2 pr-3">Avg dwell</th>
                  <th className="py-2">Avg scroll</th>
                </tr>
              </thead>
              <tbody>
                {top.map((r) => (
                  <tr key={r.article_slug} className="border-b border-white/5">
                    <td className="py-2 pr-3">
                      <code className="text-xs">{r.article_slug}</code>
                    </td>
                    <td className="py-2 pr-3">{r.views}</td>
                    <td className="py-2 pr-3">{formatMs(r.avg_dwell_ms)}</td>
                    <td className="py-2">{formatPct(r.avg_scroll)}</td>
                  </tr>
                ))}
                {!top.length ? (
                  <tr>
                    <td className="py-3 opacity-70" colSpan={4}>
                      No page_view events yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
