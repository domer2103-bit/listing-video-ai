"use client";

import { useRef, useState } from "react";

export function BeforeAfterCard({
  label,
  beforeSrc,
  afterSrc,
}: {
  label: string;
  beforeSrc: string;
  afterSrc: string;
}) {
  const [revealed, setRevealed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  function reveal() {
    setRevealed(true);
    videoRef.current?.play();
  }

  function hide() {
    setRevealed(false);
    videoRef.current?.pause();
    if (videoRef.current) videoRef.current.currentTime = 0;
  }

  return (
    <button
      type="button"
      onMouseEnter={reveal}
      onMouseLeave={hide}
      onClick={() => (revealed ? hide() : reveal())}
      className="relative aspect-video w-full overflow-hidden rounded-xl border border-neutral-200 text-left"
    >
      <img
        src={beforeSrc}
        alt={`${label} — before`}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
          revealed ? "opacity-0" : "opacity-100"
        }`}
      />
      <video
        ref={videoRef}
        src={afterSrc}
        muted
        loop
        playsInline
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
          revealed ? "opacity-100" : "opacity-0"
        }`}
      />
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-4 py-3">
        <span className="text-sm font-medium text-white">{label}</span>
        <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs text-white backdrop-blur-sm">
          {revealed ? "Animated" : "Hover to animate"}
        </span>
      </div>
    </button>
  );
}
