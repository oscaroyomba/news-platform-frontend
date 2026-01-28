// frontend/app/_components/SidebarList.tsx
import Link from "next/link";

export type SidebarItem = {
  href: string;
  title: string;
  meta?: string | null; // e.g. date, category, author, etc.
};

export default function SidebarList({
  title,
  items,
  viewAllHref,
}: {
  title: string;
  items: SidebarItem[];
  viewAllHref?: string;
}) {
  if (!items?.length) return null;

  return (
    <aside className="border border-[var(--border)] bg-white p-5 shadow-sm" aria-label={title}>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--foreground)]">
          {title}
        </h3>

        {viewAllHref ? (
          <Link
            href={viewAllHref}
            className="text-xs font-semibold underline decoration-[var(--border)] underline-offset-4 hover:decoration-[var(--accent)]"
          >
            View all
          </Link>
        ) : null}
      </div>

      <ol className="space-y-4">
        {items.map((it, idx) => (
          <li key={`${it.href}-${idx}`} className="group">
            <Link href={it.href} className="block">
              <div className="flex gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 flex-none items-center justify-center bg-[var(--surface)] text-xs font-bold text-[var(--foreground)]">
                  {idx + 1}
                </span>

                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-semibold text-[var(--foreground)] group-hover:underline decoration-[var(--accent)] underline-offset-4">
                    {it.title}
                  </p>

                  {it.meta ? <p className="mt-1 text-xs text-[var(--muted)]">{it.meta}</p> : null}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </aside>
  );
}