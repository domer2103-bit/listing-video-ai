"use client";

import { useRef } from "react";
import { trackEvent } from "@/lib/analytics";

/** Post body is raw marked.parse() HTML (see src/lib/blog.ts), so its links
 * aren't React elements we can attach onClick to individually — instead,
 * delegate a single click listener on the container and tag clicks that
 * land on one of the known CTA destinations. This catches the closing CTA
 * line every post ends with, without needing to restructure 30 Markdown
 * files with tracking markup. */
const CTA_HREF_PATTERNS = ["/for-sellers", "/for-airbnb-hosts", "/create", "/pricing"];

export function BlogPostBody({ html, slug, className }: { html: string; slug: string; className: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  function handleClick(event: React.MouseEvent<HTMLDivElement>) {
    const anchor = (event.target as HTMLElement).closest("a");
    if (!anchor) return;
    const href = anchor.getAttribute("href") ?? "";
    if (CTA_HREF_PATTERNS.some((pattern) => href.includes(pattern))) {
      trackEvent("cta_click", { source: "blog_post", slug, href });
    }
  }

  return (
    <div ref={containerRef} className={className} onClick={handleClick} dangerouslySetInnerHTML={{ __html: html }} />
  );
}
