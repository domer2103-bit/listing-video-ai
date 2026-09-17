import Link from "next/link";
import type { Metadata } from "next";
import { COMPETITORS } from "@/lib/compareData";
import { TrackedCtaLink } from "@/components/TrackedCtaLink";

export const metadata: Metadata = {
  title: "Compare",
  description:
    "How Online Viewing compares to other AI-generated property video tools — pricing, narration, input methods, and turnaround, side by side.",
  alternates: { canonical: "/compare" },
};

export default function CompareIndex() {
  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-16 space-y-12">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#0F9B7A]">Comparisons</p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-900">
          Online Viewing vs. other AI property video tools
        </h1>
        <p className="text-lg text-neutral-500">
          A growing category of tools turns property or Airbnb photos into narrated video without
          filming — here&apos;s how Online Viewing compares to specific alternatives, fact for fact.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-900">Head-to-head comparisons</h2>
        <div className="space-y-3">
          {COMPETITORS.map((c) => (
            <Link
              key={c.slug}
              href={`/compare/${c.slug}`}
              className="block rounded-xl border border-neutral-200 p-5 hover:border-[#00DEB0]/50 transition-colors"
            >
              <p className="font-medium text-neutral-900">Online Viewing vs. {c.name}</p>
              <p className="text-sm text-neutral-500 mt-1">{c.summary}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-900">Roundup</h2>
        <Link
          href="/compare/best-ai-property-video-tools"
          className="block rounded-xl border border-neutral-200 p-5 hover:border-[#00DEB0]/50 transition-colors"
        >
          <p className="font-medium text-neutral-900">Best AI property video tools</p>
          <p className="text-sm text-neutral-500 mt-1">
            A wider roundup of tools in this category, not just a single head-to-head.
          </p>
        </Link>
      </section>

      <p className="text-sm text-neutral-400">
        Pricing and features are sourced from each competitor&apos;s own public site and may have
        changed since — each page notes when it was last checked. Ready to try it yourself?{" "}
        <TrackedCtaLink
          href="/create"
          source="compare"
          location="bottom"
          className="text-[#0F9B7A] underline underline-offset-2"
        >
          Start a free video
        </TrackedCtaLink>
        .
      </p>
    </main>
  );
}
