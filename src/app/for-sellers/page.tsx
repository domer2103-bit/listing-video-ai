import Link from "next/link";
import type { Metadata } from "next";
import { BeforeAfterCard } from "@/components/BeforeAfterCard";
import { AudienceToggle } from "@/components/AudienceToggle";
import { TrackedCtaLink } from "@/components/TrackedCtaLink";
import { PLANS } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Property Listing Video for Sellers & Agents",
  description:
    "Turn any property listing into an AI-narrated video tour — paste a Rightmove or Foxtons link, or upload photos. No camera crew, no editor. Sell faster with video.",
  alternates: { canonical: "/for-sellers" },
  openGraph: {
    title: "Property Listing Video for Sellers & Agents | Online Viewing",
    description:
      "Turn any property listing into an AI-narrated video tour — paste a listing link, or upload photos. No camera crew, no editor.",
    url: "https://onlineviewing.co.uk/for-sellers",
    type: "website",
  },
};

const BEFORE_AFTER_ROOMS = [
  { label: "Reception room", slug: "reception" },
  { label: "Drawing room", slug: "drawing-room" },
  { label: "Kitchen", slug: "kitchen" },
  { label: "Roof terrace", slug: "roof-terrace" },
];

const STEPS = [
  {
    title: "Paste a link or upload photos",
    body: "Have a Rightmove or Foxtons listing? Just paste the URL. No link? Upload photos directly instead.",
  },
  {
    title: "Chat with the assistant",
    body: "It scrapes the listing, asks about anything missing, and lets you pick a narration voice — no forms.",
  },
  {
    title: "Get your video",
    body: "A fully narrated, AI-animated walkthrough — floorplan-ordered rooms, satellite intro, ready to share.",
  },
];

export default function ForSellers() {
  return (
    <>
      <section className="relative overflow-hidden bg-[#1D1B3A] px-6 py-20 sm:py-28">
        <video
          autoPlay
          muted
          loop
          playsInline
          poster="/media/marketing/hero-poster.jpg"
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        >
          <source src="/media/marketing/hero-loop.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-[#1D1B3A] via-[#1D1B3A]/85 to-[#1D1B3A]/40" />

        <div className="relative max-w-3xl mx-auto space-y-6">
          <AudienceToggle active="sale" />
          <p className="text-xs font-semibold uppercase tracking-widest text-[#00DEB0]">
            AI-narrated property video
          </p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white leading-[1.1]">
            Sell your listing faster with a cinematic video tour —{" "}
            <span className="text-[#00DEB0]">no camera crew, no editor.</span>
          </h1>
          <p className="text-lg text-white/70 max-w-xl">
            Paste a Rightmove or Foxtons listing link, or upload photos, and
            get a fully narrated, AI-animated walkthrough back in minutes —
            voiced, scored, and ready to share.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <TrackedCtaLink
              href="/create"
              source="for-sellers"
              location="hero"
              className="rounded-full bg-[#00DEB0] px-6 py-3 text-sm font-semibold text-[#1D1B3A] hover:bg-[#00DEB0]/90"
            >
              Try it free
            </TrackedCtaLink>
            <a
              href="#how-it-works"
              className="rounded-full border border-white/30 px-6 py-3 text-sm font-medium text-white hover:bg-white/10"
            >
              See how it works
            </a>
          </div>
          <p className="text-sm text-white/50 pt-2">
            Listings with video get up to 403% more inquiries than photo-only listings.
          </p>
          <p className="text-sm text-white/50">
            <Link href="/pricing" className="underline underline-offset-2 hover:text-white">
              See plans & pricing
            </Link>
          </p>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="max-w-xl space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#0F9B7A]">
              Made with the app, start to finish
            </p>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900">
              Every clip below is real output — hover to see it animate.
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {BEFORE_AFTER_ROOMS.map((room) => (
              <BeforeAfterCard
                key={room.slug}
                label={room.label}
                beforeSrc={`/media/marketing/before-${room.slug}.jpg`}
                afterSrc={`/media/marketing/after-${room.slug}.mp4`}
              />
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-neutral-50 px-6 py-20">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="max-w-xl space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#0F9B7A]">
              Three steps, no film crew required
            </p>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900">
              From listing to finished video in about two minutes.
            </h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            <div className="space-y-3">
              <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-lg bg-neutral-100 px-3 py-2 text-xs text-neutral-800">
                    Hi! I&apos;ll help you put together a narrated property
                    video. Do you have a listing URL, or would you rather
                    upload photos directly?
                  </div>
                </div>
              </div>
              <h3 className="font-medium text-neutral-900">{STEPS[0].title}</h3>
              <p className="text-sm text-neutral-500">{STEPS[0].body}</p>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm space-y-2">
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-lg bg-neutral-900 px-3 py-2 text-xs text-white">
                    https://www.rightmove.co.uk/properties/155320229
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-lg bg-neutral-100 px-3 py-2 text-xs text-neutral-800">
                    Found it! Avenue Road, St John&apos;s Wood — £49,950,000,
                    10 bed / 8 bath, 12 photos + floorplan. Want to pick a
                    narration voice before I generate?
                  </div>
                </div>
              </div>
              <h3 className="font-medium text-neutral-900">{STEPS[1].title}</h3>
              <p className="text-sm text-neutral-500">{STEPS[1].body}</p>
            </div>

            <div className="space-y-3">
              <div className="overflow-hidden rounded-xl border border-neutral-200 bg-black shadow-sm">
                <video controls muted className="aspect-video w-full">
                  <source src="/media/marketing/final-demo.mp4" type="video/mp4" />
                </video>
              </div>
              <h3 className="font-medium text-neutral-900">{STEPS[2].title}</h3>
              <p className="text-sm text-neutral-500">{STEPS[2].body}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="max-w-xl space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#0F9B7A]">
              Built for how sellers and agents actually work
            </p>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900">
              Get a video without changing your workflow.
            </h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="space-y-2">
              <h3 className="font-medium text-neutral-900">Works from what you already have</h3>
              <p className="text-sm text-neutral-500">
                Paste a Rightmove or Foxtons listing URL and the photos, price, and details are
                pulled automatically — or upload photos directly if the listing isn&apos;t live yet.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-neutral-900">Room order that makes sense</h3>
              <p className="text-sm text-neutral-500">
                Scenes are sequenced into a logical walkthrough rather than the raw upload order,
                so the finished video reads the way a viewing actually flows.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-neutral-900">One video, or a full pipeline</h3>
              <p className="text-sm text-neutral-500">
                Try it free on a single listing, or move to the Agency plan&apos;s batch generation
                if you&apos;re producing videos across a portfolio of listings.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-neutral-50 px-6 py-20">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="max-w-xl space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#0F9B7A]">Pricing</p>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900">
              Start free, upgrade only if you need more.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Object.values(PLANS).map((plan) => (
              <div key={plan.id} className="rounded-xl border border-neutral-200 bg-white p-5 space-y-1">
                <p className="font-semibold text-neutral-900">{plan.name}</p>
                <p className="text-xl font-semibold text-neutral-900">
                  {plan.priceGBP === 0 ? "Free" : `£${plan.priceGBP}/mo`}
                </p>
                <p className="text-xs text-neutral-500">
                  {plan.id === "free" ? "1 video, once" : `${plan.videosPerMonth} videos/month`}
                </p>
              </div>
            ))}
          </div>
          <Link href="/pricing" className="inline-block text-sm font-medium text-[#0F9B7A] underline underline-offset-2">
            See full plan details →
          </Link>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900">
            Give your listing the video treatment.
          </h2>
          <p className="text-neutral-500">
            Paste a listing link or upload photos and let the assistant
            handle the rest — no editing software, no camera crew.
          </p>
          <TrackedCtaLink
            href="/create"
            source="for-sellers"
            location="bottom"
            className="inline-block rounded-full bg-[#00DEB0] px-6 py-3 text-sm font-semibold text-[#1D1B3A] hover:bg-[#00DEB0]/90"
          >
            Try it free
          </TrackedCtaLink>
        </div>
      </section>
    </>
  );
}
