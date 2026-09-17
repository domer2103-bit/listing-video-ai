import Link from "next/link";
import type { Metadata } from "next";
import { COMPETITORS, ONLINE_VIEWING_SUMMARY_ROW, ROUNDUP_EXTRAS, NOT_PUBLIC } from "@/lib/compareData";
import { TrackedCtaLink } from "@/components/TrackedCtaLink";

export const metadata: Metadata = {
  title: "Best AI Property Video Tools",
  description:
    "A comparative roundup of AI tools that turn property or Airbnb photos into narrated video — pricing, input method, and narration compared, including Online Viewing.",
  alternates: { canonical: "/compare/best-ai-property-video-tools" },
};

function formatCell(value: string | typeof NOT_PUBLIC): string {
  return value === NOT_PUBLIC ? "Not publicly listed" : value;
}

export default function BestToolsRoundup() {
  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-16 space-y-10">
      <div>
        <Link href="/compare" className="text-sm text-[#0F9B7A] underline underline-offset-2">
          ← All comparisons
        </Link>
      </div>

      <header className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-900 leading-[1.15]">
          Best AI property video tools
        </h1>
        <p className="text-lg text-neutral-500">
          A category roundup, not a single head-to-head — these tools all turn existing photos (or
          a listing link) into a narrated video, without filming. Pricing and features are pulled
          from each tool&apos;s own public site.
        </p>
      </header>

      <div className="overflow-x-auto rounded-xl border border-neutral-200">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="text-left font-medium text-neutral-500 px-4 py-3">Tool</th>
              <th className="text-left font-medium text-neutral-500 px-4 py-3">Input</th>
              <th className="text-left font-medium text-neutral-500 px-4 py-3">Narration</th>
              <th className="text-left font-medium text-neutral-500 px-4 py-3">Pricing</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-neutral-100 align-top bg-[#00DEB0]/5">
              <td className="px-4 py-3 font-semibold text-[#0F9B7A]">Online Viewing</td>
              <td className="px-4 py-3 text-neutral-800">{ONLINE_VIEWING_SUMMARY_ROW.input}</td>
              <td className="px-4 py-3 text-neutral-800">{ONLINE_VIEWING_SUMMARY_ROW.narration}</td>
              <td className="px-4 py-3 text-neutral-800">{ONLINE_VIEWING_SUMMARY_ROW.pricing}</td>
            </tr>
            {COMPETITORS.map((c) => {
              const input = c.rows.find((r) => r.label === "Input method");
              const narration = c.rows.find((r) => r.label === "Narration / voice");
              const pricing = c.rows.find((r) => r.label === "Pricing");
              return (
                <tr key={c.slug} className="border-b border-neutral-100 last:border-0 align-top">
                  <td className="px-4 py-3 font-medium text-neutral-900">
                    <Link href={`/compare/${c.slug}`} className="hover:text-[#0F9B7A]">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-neutral-800">
                    {input ? formatCell(input.competitor) : "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-800">
                    {narration ? formatCell(narration.competitor) : "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-800">
                    {pricing ? formatCell(pricing.competitor) : "—"}
                  </td>
                </tr>
              );
            })}
            {ROUNDUP_EXTRAS.map((tool) => (
              <tr key={tool.name} className="border-b border-neutral-100 last:border-0 align-top">
                <td className="px-4 py-3 font-medium text-neutral-900">{tool.name}</td>
                <td className="px-4 py-3 text-neutral-800">{tool.input}</td>
                <td className="px-4 py-3 text-neutral-800">{formatCell(tool.narration)}</td>
                <td className="px-4 py-3 text-neutral-800">{formatCell(tool.pricing)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-900">Which one fits your situation</h2>
        <ul className="list-disc pl-5 space-y-2 text-neutral-600">
          <li>
            <strong className="text-neutral-900">Marketing a UK listing on Rightmove or Foxtons:</strong>{" "}
            Online Viewing and Real Estate Video Lab both accept a listing URL directly rather than
            requiring manual photo uploads.
          </li>
          <li>
            <strong className="text-neutral-900">An Airbnb or short-term rental:</strong> Online
            Viewing and PhotoAIVideo are both built specifically around that use case, with
            amenity-aware narration.
          </li>
          <li>
            <strong className="text-neutral-900">High monthly volume (100+ videos):</strong>{" "}
            VideoTour.ai&apos;s Enterprise tier (200 videos/mo) has the most headroom of the tools
            compared here.
          </li>
          <li>
            <strong className="text-neutral-900">Want staging, an AI presenter, and social scheduling bundled in:</strong>{" "}
            BetterSpace covers more than video alone.
          </li>
        </ul>
      </section>

      {ROUNDUP_EXTRAS.length > 0 && (
        <p className="text-xs text-neutral-400">
          {ROUNDUP_EXTRAS.map((t) => t.name).join(", ")} sourced from their own public sites as of{" "}
          {COMPETITORS[0]?.lastVerified}; figures for {COMPETITORS.map((c) => c.name).join(", ")} are
          detailed further on their individual comparison pages, linked above.
        </p>
      )}

      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6 text-center space-y-3">
        <p className="text-neutral-700">See how Online Viewing handles your own listing.</p>
        <TrackedCtaLink
          href="/create"
          source="compare/best-ai-property-video-tools"
          location="bottom"
          className="inline-block rounded-full bg-[#00DEB0] px-6 py-3 text-sm font-semibold text-[#1D1B3A] hover:bg-[#00DEB0]/90"
        >
          Try it free
        </TrackedCtaLink>
      </div>
    </main>
  );
}
