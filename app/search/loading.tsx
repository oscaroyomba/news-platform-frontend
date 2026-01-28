// frontend/app/search/loading.tsx
export default function LoadingSearch() {
  return (
    <main className="min-h-screen bg-[var(--surface)] px-4 py-8 text-[var(--foreground)]">
      <div className="mx-auto max-w-6xl">
        {/* Search header skeleton */}
        <div className="mb-8 rounded-2xl bg-[var(--brand)] px-5 py-4 text-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-24 rounded-full bg-white/10" />
              <div className="hidden h-5 w-px bg-white/20 md:block" />
              <div className="h-8 w-32 rounded bg-white/10" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-12 rounded bg-white/10" />
              <div className="h-4 w-2 rounded bg-white/10" />
              <div className="h-4 w-14 rounded bg-white/10" />
              <div className="h-4 w-2 rounded bg-white/10" />
              <div className="h-4 w-12 rounded bg-white/10" />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <div className="h-10 flex-1 rounded-xl bg-white/10" />
            <div className="h-10 w-28 rounded-xl bg-white/10" />
            <div className="h-10 w-24 rounded-xl bg-white/10" />
          </div>

          <div className="mt-3 h-4 w-80 rounded bg-white/10" />
        </div>

        {/* Results grid skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <article
              key={`s-${i}`}
              className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm"
            >
              <div className="aspect-[16/10] w-full bg-[var(--surface)]" />
              <div className="p-4">
                <div className="mb-3 flex gap-2">
                  <div className="h-6 w-24 rounded-full bg-[var(--surface)]" />
                  <div className="h-6 w-28 rounded-full bg-[var(--surface)]" />
                </div>
                <div className="h-6 w-full rounded bg-[var(--surface)]" />
                <div className="mt-2 h-6 w-5/6 rounded bg-[var(--surface)]" />
                <div className="mt-3 space-y-2">
                  <div className="h-4 w-full rounded bg-[var(--surface)]" />
                  <div className="h-4 w-10/12 rounded bg-[var(--surface)]" />
                  <div className="h-4 w-9/12 rounded bg-[var(--surface)]" />
                </div>
                <div className="mt-4 h-px w-full bg-[var(--border)]" />
                <div className="mt-3 flex justify-between">
                  <div className="h-3 w-32 rounded bg-[var(--surface)]" />
                  <div className="h-3 w-20 rounded bg-[var(--surface)]" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
