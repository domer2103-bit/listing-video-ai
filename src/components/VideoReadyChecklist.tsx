"use client";

import { useState } from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";

interface ChecklistItem {
  id: string;
  label: string;
  tip: string;
}

/** Grounded in two real sources rather than invented: the concrete photo
 * advice already published in content/blog/listing-photo-mistakes.md, and
 * the chat agent's actual technical minimum (3 tagged photos required to
 * generate at all — see src/lib/chat/agent.ts). */
const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: "count",
    label: "You have at least 5–8 photos covering your main rooms",
    tip: "5–8+ gives a fuller walkthrough — the tool needs a minimum of 3 tagged photos to generate a video at all, so treat that as the absolute floor, not the target.",
  },
  {
    id: "lighting",
    label: "Photos are well-lit — natural daylight, not dark or grainy",
    tip: "Reshoot during the time of day that suits the room's aspect — usually mid-morning for east-facing rooms, late afternoon for west-facing.",
  },
  {
    id: "exterior",
    label: "You have an exterior or entrance photo",
    tip: "An exterior shot gives buyers context before the interior tour begins, and it's often the first thing shown in search results.",
  },
  {
    id: "declutter",
    label: "Rooms are decluttered — no people, pets, or personal clutter in frame",
    tip: "Clear personal items before shooting — buyers imagining their own life in a space are distracted by someone else's.",
  },
  {
    id: "coverage",
    label: "Each main room has its own wide shot, not just close-ups of one or two",
    tip: "Every room you want in the video needs its own photo — rooms are tagged and sequenced individually, so a missing room means a missing scene.",
  },
  {
    id: "scale",
    label: "At least one photo shows scale — a doorway or hallway in frame, not only ultra-wide shots",
    tip: "Ultra-wide lenses can make small rooms look larger than they are. A doorway or hallway in frame sets honest expectations before a viewing.",
  },
  {
    id: "feature",
    label: "You have a standout feature photo — a view, distinctive room, or outdoor space",
    tip: "Make sure your best feature is actually photographed — it's often what closes the deal, and video can be sequenced to lead with it.",
  },
];

function getResult(checkedCount: number, total: number) {
  const ratio = checkedCount / total;
  if (ratio >= 0.85) {
    return {
      bucket: "ready" as const,
      heading: "Great — your photos are video-ready.",
      body: "This photo set has what it needs for a strong narrated walkthrough. You're ready to generate.",
      color: "text-[#0F9B7A]",
      bg: "bg-[#00DEB0]/10",
    };
  }
  if (ratio >= 0.4) {
    return {
      bucket: "needs_fixes" as const,
      heading: "A few quick fixes would help.",
      body: "You've got a workable set, but addressing the gaps below will noticeably improve the finished video.",
      color: "text-amber-700",
      bg: "bg-amber-50",
    };
  }
  return {
    bucket: "reshoot" as const,
    heading: "Consider retaking a few photos first.",
    body: "There's enough missing here that a short reshoot will make a bigger difference than jumping straight to video.",
    color: "text-red-700",
    bg: "bg-red-50",
  };
}

export function VideoReadyChecklist() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const checkedCount = CHECKLIST_ITEMS.filter((item) => checked[item.id]).length;
  const result = getResult(checkedCount, CHECKLIST_ITEMS.length);
  const weakItems = CHECKLIST_ITEMS.filter((item) => !checked[item.id]);

  function toggle(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="space-y-8">
      <ul className="space-y-3">
        {CHECKLIST_ITEMS.map((item) => (
          <li key={item.id}>
            <label className="flex items-start gap-3 rounded-xl border border-neutral-200 p-4 cursor-pointer hover:border-[#00DEB0]/50 transition-colors">
              <input
                type="checkbox"
                checked={checked[item.id] ?? false}
                onChange={() => toggle(item.id)}
                className="mt-0.5 h-5 w-5 shrink-0 rounded border-neutral-300 accent-[#00DEB0] focus:ring-[#00DEB0]"
              />
              <span className="text-neutral-800">{item.label}</span>
            </label>
          </li>
        ))}
      </ul>

      <div className={`rounded-xl p-6 space-y-2 ${result.bg}`}>
        <p className="text-sm font-medium text-neutral-500">
          Score: {checkedCount} of {CHECKLIST_ITEMS.length}
        </p>
        <h2 className={`text-xl font-semibold ${result.color}`}>{result.heading}</h2>
        <p className="text-neutral-700">{result.body}</p>
      </div>

      {weakItems.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-neutral-900">Where to focus</h3>
          <ul className="space-y-3">
            {weakItems.map((item) => (
              <li key={item.id} className="text-sm text-neutral-600">
                <span className="font-medium text-neutral-900">{item.label}.</span> {item.tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6 text-center space-y-3">
        <p className="text-neutral-700">
          Whatever your score, the fastest way to see it in action is to try it with your own photos.
        </p>
        <Link
          href="/create"
          onClick={() =>
            trackEvent("checklist_completed", { bucket: result.bucket, checkedCount, total: CHECKLIST_ITEMS.length })
          }
          className="inline-block rounded-full bg-[#00DEB0] px-6 py-3 text-sm font-semibold text-[#1D1B3A] hover:bg-[#00DEB0]/90"
        >
          Try it free
        </Link>
      </div>
    </div>
  );
}
