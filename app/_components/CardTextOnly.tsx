// frontend/app/_components/CardTextOnly.tsx
import Link from "next/link";

type Pill = { name: string; slug: string };

export default function CardTextOnly(props: {
  href: string;
  title: string;
  excerpt?: string | null;
  publishedAt?: string | null;
  category?: Pill | null;
  author?: Pill | null;
}) {
  const { href, title, excerpt, publishedAt, category, author } = props;

  return (
    <article className="group rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
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
        <span>{publishedAt ? new Date(publishedAt).toLocaleDateString() : "—"}</span>
      </div>
    </article>
  );
}
