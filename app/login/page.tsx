"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });

    const data = await r.json().catch(() => ({}));
    setLoading(false);

    if (!r.ok) {
      setErr(data?.error ?? "Login failed");
      return;
    }

    // safer than router.back() in some cases
    if (window.history.length > 1) router.back();
    else router.push("/");
  }

  return (
    <main className="min-h-screen bg-[var(--surface)] px-4 py-10 text-[var(--foreground)]">
      <div className="mx-auto max-w-md rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Log in</h1>

        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          <input
            className="w-full rounded-xl border border-[var(--border)] px-3 py-2"
            placeholder="Email or username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
          <input
            className="w-full rounded-xl border border-[var(--border)] px-3 py-2"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {err ? <p className="text-sm text-red-600">{err}</p> : null}

          <button
            disabled={loading}
            className="w-full rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-black hover:opacity-95 disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </main>
  );
}