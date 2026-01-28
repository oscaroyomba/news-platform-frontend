// frontend/app/_components/NewsletterCTA.tsx
"use client";

import { useMemo, useState } from "react";

export default function NewsletterCTA() {
  const [email, setEmail] = useState("");

  const canSubmit = useMemo(() => {
    return email.trim().length > 3 && email.includes("@");
  }, [email]);

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <div className="rounded-xl bg-[var(--brand)] p-4 text-white">
        <h3 className="font-[var(--font-serif)] text-lg font-bold tracking-tight">
          Get the morning headlines
        </h3>
        <p className="mt-1 text-sm text-white/80">
          Weekly digest — simple, no spam.
        </p>

        <form
          className="mt-4 flex gap-2"
          action="#"
          method="POST"
          aria-label="Newsletter signup"
          onSubmit={(e) => {
            e.preventDefault();
            // later: call real endpoint
            alert("Thanks! Newsletter hookup comes later.");
          }}
        >
          <input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
            className="w-full flex-1 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/60 outline-none focus:border-[var(--accent)]"
          />
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-black hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Sign up
          </button>
        </form>
	{/*
        <p className="mt-2 text-xs text-white/70">
          (wiring to a real endpoint.)
        </p>
	*/}
      </div>
    </section>
  );
}
