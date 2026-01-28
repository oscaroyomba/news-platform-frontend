import Link from "next/link";
import Image from "next/image";

function formatDateShort(iso?: string | null) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function formatTimeAgo(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  // If older than 48h, show normal date
  if (diffMin > 60 * 48) return formatDateShort(iso);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export default function HeroLead(props: {
  href: string;
  title: string;
  excerpt?: string | null;
  coverUrl?: string | null;
  publishedAt?: string | null;
}) {
  const { href, title, excerpt, coverUrl, publishedAt } = props;

  const timeLabel = formatTimeAgo(publishedAt);

  return (
    <section className="overflow-hidden border border-[var(--border)] bg-white shadow-sm">
      <div className="grid gap-0 md:grid-cols-12">
        {/* Image */}
        <div className="md:col-span-7">
          <Link href={href} className="block" aria-label={title} title={title}>
            {coverUrl ? (
              <div className="relative aspect-[16/9] w-full bg-[var(--surface)]">
                <Image
                  src={coverUrl}
                  alt={title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 60vw"
                  unoptimized
                  priority
                />
                {/* Accent bar */}
                <div className="absolute left-0 top-0 h-1 w-full bg-[var(--accent)]" />
              </div>
            ) : (
              <div className="flex aspect-[16/9] w-full items-center justify-center bg-[var(--surface)] text-sm text-[var(--muted)]">
                No cover image
              </div>
            )}
          </Link>
        </div>

        {/* Text */}
        <div className="p-5 md:col-span-5 md:p-6">
          <Link href={href} className="block" aria-label={title} title={title}>
            <h2 className="font-[var(--font-serif)] text-3xl font-bold leading-tight tracking-tight hover:underline decoration-[var(--accent)] underline-offset-4">
              {title}
            </h2>

 		{excerpt ? (
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)] line-clamp-4">
                {excerpt}
              </p>
            ) : null}
          </Link>

          {/* Meta (time/date only) */}
          <div className="mt-5 border-t border-[var(--border)] pt-3 text-xs text-[var(--muted)]">
            <span>{timeLabel || "—"}</span>
          </div>
        </div>
      </div>
    </section>
  );
}