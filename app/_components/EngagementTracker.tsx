"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

type EngagementPayload = {
  event_name: string;
  path: string;
  article_slug?: string | null;
  referrer?: string | null;
  user_agent?: string | null;
  device_type?: string | null;
  session_id?: string | null;
  dwell_ms?: number | null;
  scroll_depth?: number | null;
  extra?: any;
};

function getDeviceType(ua: string) {
  const s = ua.toLowerCase();
  if (s.includes("mobi")) return "mobile";
  if (s.includes("tablet") || s.includes("ipad")) return "tablet";
  return "desktop";
}

function getOrCreateSessionId() {
  try {
    const key = "eng_session_id";
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(key, id);
    return id;
  } catch {
    return null;
  }
}

async function postEngagement(payload: EngagementPayload) {
  try {
    await fetch("/api/engagement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch {
    // ignore in client (don't crash UI)
  }
}

function extractArticleSlug(pathname: string) {
  // if your article route is /article/[slug]
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "article" && parts[1]) return parts[1];
  return null;
}

export default function EngagementTracker() {
  const pathname = usePathname();

  // timers
  const startMsRef = useRef<number>(Date.now());

  // scroll milestones per page
  const firedScrollMilestonesRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    // reset for new page
    startMsRef.current = Date.now();
    firedScrollMilestonesRef.current = new Set();

    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const sessionId = getOrCreateSessionId();
    const articleSlug = extractArticleSlug(pathname);

    // 1) page_view
    postEngagement({
      event_name: "page_view",
      path: pathname,
      article_slug: articleSlug,
      referrer: document.referrer || null,
      user_agent: ua || null,
      device_type: ua ? getDeviceType(ua) : null,
      session_id: sessionId,
    });

    // 2) scroll depth (send at 25/50/75/100 once each)
    const onScroll = () => {
      const doc = document.documentElement;
      const scrollTop = window.scrollY || doc.scrollTop || 0;
      const maxScroll = (doc.scrollHeight || 0) - (window.innerHeight || 0);
      if (maxScroll <= 0) return;

      const pct = Math.min(100, Math.max(0, Math.round((scrollTop / maxScroll) * 100)));

      const milestones = [25, 50, 75, 100];
      for (const m of milestones) {
        if (pct >= m && !firedScrollMilestonesRef.current.has(m)) {
          firedScrollMilestonesRef.current.add(m);

          postEngagement({
            event_name: "scroll",
            path: pathname,
            article_slug: articleSlug,
            referrer: document.referrer || null,
            user_agent: ua || null,
            device_type: ua ? getDeviceType(ua) : null,
            session_id: sessionId,
            scroll_depth: m,
          });
        }
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    // 3) time_on_page (send on leave / route change / tab close)
    const sendTimeOnPage = () => {
      const dwell = Date.now() - startMsRef.current;

      // avoid tiny pings if user bounces instantly
      if (dwell < 500) return;

      postEngagement({
        event_name: "time_on_page",
        path: pathname,
        article_slug: articleSlug,
        referrer: document.referrer || null,
        user_agent: ua || null,
        device_type: ua ? getDeviceType(ua) : null,
        session_id: sessionId,
        dwell_ms: dwell,
      });
    };

    // route changes trigger cleanup -> we send in cleanup
    // tab/window close:
    window.addEventListener("beforeunload", sendTimeOnPage);

    return () => {
      // when navigating away to another route
      sendTimeOnPage();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("beforeunload", sendTimeOnPage);
    };
  }, [pathname]);

  return null;
}
