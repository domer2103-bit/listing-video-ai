import type { Metadata } from "next";
import { VideoReadyChecklist } from "@/components/VideoReadyChecklist";

export const metadata: Metadata = {
  title: "Is Your Listing Photo-Ready for Video? Free Checklist",
  description:
    "A free interactive checklist to check whether your property or Airbnb photos are ready to become a narrated video — get an instant score and exactly what to fix.",
  alternates: { canonical: "/tools/video-ready-checklist" },
  openGraph: {
    title: "Is Your Listing Photo-Ready for Video? Free Checklist | Online Viewing",
    description:
      "Check whether your property or Airbnb photos are ready to become a narrated video — get an instant score and exactly what to fix.",
    url: "https://onlineviewing.co.uk/tools/video-ready-checklist",
    type: "website",
  },
};

export default function VideoReadyChecklistPage() {
  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-16 space-y-10">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#0F9B7A]">Free tool</p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-900">
          Is your listing video-ready?
        </h1>
        <p className="text-lg text-neutral-500">
          Check the photos you already have against the same things that make the difference
          between a strong narrated video and a weak one. Tick what applies — your score and
          specific fixes update as you go.
        </p>
      </header>

      <VideoReadyChecklist />
    </main>
  );
}
