"use client";

import { useState } from "react";
import Link from "next/link";
import { Project } from "@/lib/types";
import { runPipeline as runPipelineSteps } from "@/lib/clientPipeline";
import { BeforeAfterCard } from "@/components/BeforeAfterCard";
import { AudienceToggle } from "@/components/AudienceToggle";
import { useStoredEmail } from "@/lib/useStoredEmail";
import { EmailGate } from "@/components/EmailGate";

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

const STAGE_LABELS: Record<string, string> = {
  created: "Created",
  scraping: "Scraping listing…",
  scraped: "Listing scraped",
  scripting: "Writing script…",
  scripted: "Script ready",
  narrating: "Generating narration…",
  narrated: "Narration ready",
  animating: "Animating scenes…",
  animated: "Scenes animated",
  assembling: "Assembling final video…",
  done: "Done",
  failed: "Failed",
};

export default function Home() {
  const { email, setEmail, loaded } = useStoredEmail();
  const [sourceUrl, setSourceUrl] = useState("");
  const [project, setProject] = useState<Project | null>(null);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [upgradeMessage, setUpgradeMessage] = useState<string | null>(null);

  function appendLog(line: string) {
    setLog((prev) => [...prev, line]);
  }

  async function runPipeline() {
    if (!sourceUrl || !email) return;
    setRunning(true);
    setLog([]);
    setProject(null);
    setUpgradeMessage(null);

    try {
      appendLog("Creating project & scraping listing…");
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceUrl, email }),
      });
      const data = await res.json();
      if (res.status === 402) {
        setUpgradeMessage(data.error ?? "You've reached your plan's video limit.");
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "Failed to create project");
      const created = data.project as Project;
      setProject(created);
      if (created.status === "failed") throw new Error(created.error ?? "Scrape failed");

      await runPipelineSteps(created.id, appendLog, setProject);
    } catch (err) {
      appendLog(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setRunning(false);
    }
  }

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
            Turn any listing into a cinematic promo video —{" "}
            <span className="text-[#00DEB0]">no camera crew, no editor.</span>
          </h1>
          <p className="text-lg text-white/70 max-w-xl">
            Paste a listing link or upload photos, and get a fully narrated,
            AI-animated walkthrough back in minutes — voiced, scored, and
            ready to share.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/create"
              className="rounded-full bg-[#00DEB0] px-6 py-3 text-sm font-semibold text-[#1D1B3A] hover:bg-[#00DEB0]/90"
            >
              Try it free
            </Link>
            <a
              href="#quick-generate"
              className="rounded-full border border-white/30 px-6 py-3 text-sm font-medium text-white hover:bg-white/10"
            >
              Or paste a link below
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

      <section className="bg-neutral-50 px-6 py-20">
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

      <main id="quick-generate" className="flex-1 max-w-3xl mx-auto w-full px-6 py-16 space-y-10">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Quick generate</h2>
        <p className="text-neutral-500">
          Already have a listing URL? Paste it below to generate a video
          straight away, using the classic flow — no chat needed.
        </p>
      </header>

      {loaded && !email && <EmailGate onSubmit={setEmail} />}

      {email && (
        <form
          className="flex gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            runPipeline();
          }}
        >
          <input
            type="url"
            required
            placeholder="https://www.rightmove.co.uk/properties/..."
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            className="flex-1 rounded-md border border-neutral-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
          <button
            type="submit"
            disabled={running}
            className="rounded-md bg-neutral-900 px-5 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            {running ? "Generating…" : "Generate video"}
          </button>
        </form>
      )}

      {upgradeMessage && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {upgradeMessage}{" "}
          <Link href="/pricing" className="font-medium underline underline-offset-2">
            View plans
          </Link>
        </div>
      )}

      {log.length > 0 && (
        <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4 text-sm space-y-1 font-mono">
          {log.map((line, i) => (
            <div key={i} className="text-neutral-600">
              {line}
            </div>
          ))}
        </div>
      )}

      {project && (
        <section className="space-y-6">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">Status:</span>
            <span
              className={
                project.status === "failed"
                  ? "text-red-600"
                  : project.status === "done"
                    ? "text-green-600"
                    : "text-neutral-600"
              }
            >
              {STAGE_LABELS[project.status] ?? project.status}
            </span>
          </div>

          {project.error && (
            <p className="text-sm text-red-600">{project.error}</p>
          )}

          {project.listing && (
            <div className="text-sm space-y-1">
              <p className="font-medium">{project.listing.address || "Listing"}</p>
              <p className="text-neutral-500">
                {project.listing.price} · {project.listing.photos.length} photos found
              </p>
            </div>
          )}

          {project.finalVideoUrl && (
            <video controls className="w-full rounded-lg border border-neutral-200">
              <source src={project.finalVideoUrl} type="video/mp4" />
            </video>
          )}

          {project.scenes && project.scenes.length > 0 && (
            <ol className="space-y-3">
              {project.scenes.map((scene) => (
                <li
                  key={scene.id}
                  className="flex items-start gap-3 rounded-md border border-neutral-200 p-3 text-sm"
                >
                  <img
                    src={scene.sourceImageUrl}
                    alt={scene.roomType ?? "scene"}
                    className="h-16 w-24 rounded object-cover"
                  />
                  <div className="flex-1 space-y-1">
                    <p className="font-medium capitalize">{scene.roomType}</p>
                    <p className="text-neutral-600">{scene.narration}</p>
                    <p className="text-xs text-neutral-400">
                      {scene.cameraMotion} · video: {scene.videoStatus}
                      {scene.narrationAudioUrl ? " · narration ready" : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
      </main>
    </>
  );
}
