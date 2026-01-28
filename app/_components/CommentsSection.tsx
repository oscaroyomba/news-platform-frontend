"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

function unwrap(item: any) {
  return item?.attributes ? { id: item.id, ...item.attributes } : item;
}

export default function CommentsSection({
  articleId,
  articleSlug,
}: {
  articleId: number;
  articleSlug?: string;
}) {
  const [me, setMe] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  async function loadAll() {
    setErr(null);

    const qs = articleId
      ? `articleId=${encodeURIComponent(String(articleId))}`
      : `slug=${encodeURIComponent(articleSlug ?? "")}`;

    const [meRes, cRes] = await Promise.all([
      fetch("/api/auth/me", { cache: "no-store" }),
      fetch(`/api/comments?${qs}`, { cache: "no-store" }),
    ]);

    const meJson = await meRes.json().catch(() => ({}));
    setMe(meJson?.user ?? null);

    const cJson = await cRes.json().catch(() => ({}));
    const data = cJson?.data ?? [];
    setComments(data.map(unwrap));
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId, articleSlug]);

  async function submit() {
    setErr(null);
    if (!content.trim()) return;

    setPosting(true);
    const r = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content.trim(), articleId }),
    });

    const json = await r.json().catch(() => ({}));
    setPosting(false);

    if (!r.ok) {
      setErr(json?.error ?? "Failed to post comment");
      return;
    }

    setContent("");
    await loadAll();
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Comments</h2>

        {me ? (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await fetch("/api/auth/logout", { method: "POST" });
              await loadAll();
            }}
          >
            <button className="text-sm underline decoration-[var(--accent)] underline-offset-4">
              Log out
            </button>
          </form>
        ) : (
          <Link
            href="/login"
            className="text-sm underline decoration-[var(--accent)] underline-offset-4"
          >
            Log in to comment
          </Link>
        )}
      </div>

      {me ? (
        <div className="mt-4 space-y-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
            rows={3}
            placeholder="Write a comment…"
          />
          {err ? <p className="text-sm text-red-600">{err}</p> : null}
          <button
            disabled={posting}
            onClick={submit}
            className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-black hover:opacity-95 disabled:opacity-60"
          >
            {posting ? "Posting..." : "Post comment"}
          </button>
        </div>
      ) : null}

      <div className="mt-6 space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No comments yet.</p>
        ) : (
          comments.map((c) => {
            const authorName =
              c?.author?.data?.attributes?.username ??
              c?.author?.username ??
              "User";

            const created = c?.createdAt
              ? new Date(c.createdAt).toLocaleString()
              : "";

            return (
              <div key={c.id} className="rounded-xl border border-[var(--border)] p-4">
                <div className="flex items-center justify-between gap-3 text-xs text-[var(--muted)]">
                  <span className="font-medium text-[var(--foreground)]">
                    {authorName}
                  </span>
                  <span>{created}</span>
                </div>
                <p className="mt-2 text-sm">{c.content ?? ""}</p>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}



