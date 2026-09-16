import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { COMPETITORS, NOT_PUBLIC, getCompetitorBySlug } from "@/lib/compareData";

export async function generateStaticParams() {
  return COMPETITORS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const competitor = getCompetitorBySlug(slug);
  if (!competitor) return {};

  const url = `https://onlineviewing.co.uk/compare/${competitor.slug}`;
  return {
    title: `Online Viewing vs. ${competitor.name}`,
    description: competitor.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: `Online Viewing vs. ${competitor.name}`,
      description: competitor.metaDescription,
      url,
      type: "article",
    },
  };
}

function formatCell(value: string | typeof NOT_PUBLIC): string {
  return value === NOT_PUBLIC ? "Not publicly listed" : value;
}

export default async function ComparePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const competitor = getCompetitorBySlug(slug);
  if (!competitor) notFound();

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-16 space-y-10">
      <div>
        <Link href="/compare" className="text-sm text-[#0F9B7A] underline underline-offset-2">
          ← All comparisons
        </Link>
      </div>

      <header className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-900 leading-[1.15]">
          Online Viewing vs. {competitor.name}
        </h1>
        <p className="text-lg text-neutral-500">{competitor.summary}</p>
      </header>

      <div className="overflow-x-auto rounded-xl border border-neutral-200">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="text-left font-medium text-neutral-500 px-4 py-3 w-1/3">&nbsp;</th>
              <th className="text-left font-semibold text-[#0F9B7A] px-4 py-3 bg-[#00DEB0]/5">
                Online Viewing
              </th>
              <th className="text-left font-semibold text-neutral-900 px-4 py-3">{competitor.name}</th>
            </tr>
          </thead>
          <tbody>
            {competitor.rows.map((row) => (
              <tr key={row.label} className="border-b border-neutral-100 last:border-0 align-top">
                <td className="px-4 py-3 font-medium text-neutral-500">{row.label}</td>
                <td className="px-4 py-3 text-neutral-800 bg-[#00DEB0]/5">{row.onlineViewing}</td>
                <td className="px-4 py-3 text-neutral-800">{formatCell(row.competitor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-neutral-900">
            Where {competitor.name} might be the better fit
          </h2>
          <p className="text-neutral-600">{competitor.betterFitForCompetitor}</p>
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-neutral-900">Where Online Viewing might be the better fit</h2>
          <p className="text-neutral-600">{competitor.betterFitForOnlineViewing}</p>
        </div>
      </section>

      <p className="text-xs text-neutral-400">
        Pricing and features for {competitor.name} are sourced from{" "}
        <a
          href={competitor.sourceUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="underline underline-offset-2"
        >
          their own public site
        </a>{" "}
        as of {competitor.lastVerified}, and may have changed since — check their site directly for
        current details.
      </p>

      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6 text-center space-y-3">
        <p className="text-neutral-700">See how Online Viewing handles your own listing.</p>
        <Link
          href="/create"
          className="inline-block rounded-full bg-[#00DEB0] px-6 py-3 text-sm font-semibold text-[#1D1B3A] hover:bg-[#00DEB0]/90"
        >
          Try it free
        </Link>
      </div>
    </main>
  );
}
