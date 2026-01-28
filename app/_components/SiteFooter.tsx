// frontend/app/_components/SiteFooter.tsx
import Link from "next/link";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "News Platform";

export default function SiteFooter() {
  return (
    <footer className="mt-14 border-t border-[var(--border)] bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm md:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="font-[var(--font-serif)] text-lg font-bold">
              {SITE_NAME}
            </div>
            <p className="mt-2 text-[var(--muted)]">
              Independent news, analysis and stories.
            </p>
          </div>

          <div>
            <div className="font-semibold">Pages</div>
            <ul className="mt-3 space-y-2 text-[var(--muted)]">
              <li><Link className="hover:underline" href="/">Home</Link></li>
              <li><Link className="hover:underline" href="/categories">Categories</Link></li>
              <li><Link className="hover:underline" href="/search">Search</Link></li>
            </ul>
          </div>

          <div>
            <div className="font-semibold">Contact</div>
            <p className="mt-3 text-[var(--muted)]">
              Email: <span className="underline">editor@yourdomain.com</span>
            </p>
            <p className="mt-1 text-[var(--muted)]">
              Twitter/X: <span className="underline">@yourhandle</span>
            </p>
          </div>
        </div>

        <div className="mt-10 text-xs text-[var(--muted)]">
          © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
