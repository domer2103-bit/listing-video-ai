"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { trackEvent } from "@/lib/analytics";

/** A plain next/link that also fires a "cta_click" analytics event —
 * needed because the pages this is used on (compare, persona landing
 * pages) are Server Components for their metadata exports, and can't
 * attach onClick handlers to a DOM element directly themselves. */
export function TrackedCtaLink({
  href,
  children,
  className,
  source,
  location,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  /** Which page this CTA lives on, e.g. "for-sellers", "compare/betterspace". */
  source: string;
  /** Where on that page, e.g. "hero", "bottom". */
  location: string;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => trackEvent("cta_click", { source, location, href })}
    >
      {children}
    </Link>
  );
}
