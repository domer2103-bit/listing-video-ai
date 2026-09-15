"use client";

import Link from "next/link";

export function AudienceToggle({ active }: { active: "sale" | "airbnb" }) {
  return (
    <div className="inline-flex rounded-full border border-white/20 bg-white/5 p-1 text-sm">
      <Link
        href="/"
        className={`rounded-full px-4 py-1.5 font-medium transition-colors ${
          active === "sale" ? "bg-white text-[#1D1B3A]" : "text-white/60 hover:text-white"
        }`}
      >
        For Sellers
      </Link>
      <Link
        href="/airbnb"
        className={`rounded-full px-4 py-1.5 font-medium transition-colors ${
          active === "airbnb" ? "bg-white text-[#1D1B3A]" : "text-white/60 hover:text-white"
        }`}
      >
        For Airbnb Hosts
      </Link>
    </div>
  );
}
