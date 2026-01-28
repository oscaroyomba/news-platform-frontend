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

  if (diffMin > 60 * 48) return formatDateShort(iso);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export default function StoryCard(props: {
  href: string;
  title: string;
  excerpt?: string | null;
  coverUrl?: string | null;
  publishedAt?: string | null;
}) {
  const { href, title, excerpt, coverUrl, publishedAt } = props;

  const timeLabel = formatTimeAgo(publishedAt);

  return (
    <article className="group overflow-hidden border border-[var(--border)] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link href={href} className="block" aria-label={title} title={title}>
        {coverUrl ? (
          <div className="relative aspect-[16/10] w-full bg-[var(--surface)]">
            <Image
              src={coverUrl}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 33vw"
              unoptimized
            />
            <div className="absolute left-0 top-0 h-1 w-full bg-[var(--accent)]" />
          </div>
        ) : (
          <div className="flex aspect-[16/10] w-full items-center justify-center bg-[var(--surface)] text-sm text-[var(--muted)]">
            No cover image
          </div>
        )}
      </Link>

      <div className="p-4">
        <Link href={href} className="block" aria-label={title} title={title}>
          <h3 className="font-[var(--font-serif)] text-lg font-bold leading-snug tracking-tight group-hover:underline decoration-[var(--accent)] underline-offset-4">
            {title}
          </h3>

          {excerpt ? (
            <p className="mt-2 text-sm text-[var(--muted)] line-clamp-3">
              {excerpt}
            </p>
          ) : null}
        </Link>

        {/* Meta (time/date only) */}
        <div className="mt-4 border-t border-[var(--border)] pt-3 text-xs text-[var(--muted)]">
          <span>{timeLabel || "—"}</span>
   	</div>
      </div>
    </article>
  );
}


