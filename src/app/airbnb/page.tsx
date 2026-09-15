"use client";

import Link from "next/link";
import { BeforeAfterCard } from "@/components/BeforeAfterCard";
import { AudienceToggle } from "@/components/AudienceToggle";

const BEFORE_AFTER_ROOMS = [
  { label: "Living room", slug: "airbnb-living-room" },
  { label: "Bedroom", slug: "airbnb-bedroom" },
  { label: "Kitchen", slug: "airbnb-kitchen" },
  { label: "Balcony", slug: "airbnb-balcony" },
];

const STEPS = [
  {
    title: "Upload your photos",
    body: "No listing link needed — just the photos you'd normally upload to Airbnb. Add a few details about the place.",
  },
  {
    title: "Chat with the assistant",
    body: "It asks about anything missing, tags each room, and lets you pick a narration voice — no forms.",
  },
  {
    title: "Get your video",
    body: "A fully narrated, AI-animated walkthrough of your place — ready to drop into your listing or share on socials.",
  },
];

export default function AirbnbLanding() {
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
          <AudienceToggle active="airbnb" />
          <p className="text-xs font-semibold uppercase tracking-widest text-[#FF5A5F]">
            AI-narrated Airbnb video
          </p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white leading-[1.1]">
            Turn your listing photos into a booking-ready promo video —{" "}
            <span className="text-[#FF5A5F]">no camera crew, no editor.</span>
          </h1>
          <p className="text-lg text-white/70 max-w-xl">
            Upload the photos you already have and get a fully narrated,
            AI-animated walkthrough back in minutes — voiced, scored, and
            ready to drop into your listing or share on socials.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/create?mode=airbnb"
              className="rounded-full bg-[#FF5A5F] px-6 py-3 text-sm font-semibold text-white hover:bg-[#FF5A5F]/90"
            >
              Try it free
            </Link>
            <a
              href="#how-it-works"
              className="rounded-full border border-white/30 px-6 py-3 text-sm font-medium text-white hover:bg-white/10"
            >
              See how it works
            </a>
          </div>
          <p className="text-sm text-white/50 pt-2">
            Guests decide in seconds — give your listing motion, not just
            static photos.
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
            <p className="text-xs font-semibold uppercase tracking-widest text-[#D93A3F]">
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
            <p className="text-xs font-semibold uppercase tracking-widest text-[#D93A3F]">
              Three steps, no film crew required
            </p>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900">
              From photos to finished video in about two minutes.
            </h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            <div className="space-y-3">
              <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-lg bg-neutral-100 px-3 py-2 text-xs text-neutral-800">
                    Hi! I&apos;ll help you put together a narrated video for
                    your Airbnb listing. Let&apos;s start with the basics —
                    where&apos;s the place, and what&apos;s the nightly rate?
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
                    2-bed flat in Shoreditch, £145/night — just uploaded 9 photos
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-lg bg-neutral-100 px-3 py-2 text-xs text-neutral-800">
                    Got it! Quick one — which photo&apos;s the living room, and
                    which is the bedroom? Then want to pick a narration voice
                    before I generate?
                  </div>
                </div>
              </div>
              <h3 className="font-medium text-neutral-900">{STEPS[1].title}</h3>
              <p className="text-sm text-neutral-500">{STEPS[1].body}</p>
            </div>

            <div className="space-y-3">
              <div className="overflow-hidden rounded-xl border border-neutral-200 bg-black shadow-sm">
                <video controls muted className="aspect-video w-full">
                  <source src="/media/marketing/final-demo-airbnb.mp4" type="video/mp4" />
                </video>
              </div>
              <h3 className="font-medium text-neutral-900">{STEPS[2].title}</h3>
              <p className="text-sm text-neutral-500">{STEPS[2].body}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900">
            Give your listing the video treatment.
          </h2>
          <p className="text-neutral-500">
            Upload your photos and let the assistant handle the rest — no
            editing software, no camera crew.
          </p>
          <Link
            href="/create?mode=airbnb"
            className="inline-block rounded-full bg-[#1D1B3A] px-6 py-3 text-sm font-semibold text-white hover:bg-[#1D1B3A]/90"
          >
            Try it free
          </Link>
        </div>
      </section>
    </>
  );
}
