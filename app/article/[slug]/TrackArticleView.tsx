"use client";

import { useEffect } from "react";
import { getSessionId } from "@/lib/analytics";

export default function TrackArticleView({
  path,
  articleSlug,
}: {
  path: string;
  articleSlug: string;
}) {
  useEffect(() => {
    const session_id = getSessionId();

    fetch("/api/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        event_name: "page_view",
        path,
        article_slug: articleSlug,
        session_id,
      }),
    }).catch(() => {});
  }, [path, articleSlug]);

  return null;
}
