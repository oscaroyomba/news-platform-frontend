import Link from "next/link";
import Image from "next/image";

type Pill = { name: string; slug: string };

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

export default function CardGrid(props: {
  href: string;
  title: string;
  excerpt?: string | null;
  coverUrl?: string | null;
  publishedAt?: string | null;
  category?: Pill | null;
  author?: Pill | null;
}) {
  const { href, title, excerpt, coverUrl, publishedAt, category, author } = props;

  return (
    <article className="group overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link href={href} className="block">
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
        <div className="mb-3 flex flex-wrap gap-2">
          {category?.slug ? (
            <Link
              href={`/category/${category.slug}`}
              className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs font-medium text-[var(--foreground)] hover:bg-white"
            >
              {category.name}
            </Link>
          ) : null}

          {author?.slug ? (
            <Link
              href={`/author/${author.slug}`}
              className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs font-medium text-[var(--foreground)] hover:bg-white"
            >
              By {author.name}
            </Link>
          ) : null}
        </div>

        <Link href={href} className="block">
          <h3 className="font-[var(--font-serif)] text-lg font-bold leading-snug tracking-tight group-hover:underline decoration-[var(--accent)] underline-offset-4">
            {title}
          </h3>

          <p className="mt-2 line-clamp-3 text-sm text-[var(--muted)]">
            {excerpt ?? "No excerpt yet."}
          </p>
        </Link>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--border)] pt-3 text-xs text-[var(--muted)]">
          <span className="truncate">{href}</span>
          <span>{formatDateShort(publishedAt) || "—"}</span>
        </div>
      </div>
    </article>
  );
}
