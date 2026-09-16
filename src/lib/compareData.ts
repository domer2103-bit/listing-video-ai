/** Comparison-page data — hardcoded rather than scraped live, same
 * "file-based, no DB" philosophy as the rest of this app. Every field here
 * is sourced from the competitor's own public site (see `sourceUrl` +
 * `lastVerified`); anything they don't publicly state is marked
 * `NOT_PUBLIC` rather than guessed, and rendered as "Not publicly listed"
 * instead of a fabricated value. */

export const NOT_PUBLIC = "NOT_PUBLIC" as const;

export interface CompareRow {
  label: string;
  onlineViewing: string;
  competitor: string | typeof NOT_PUBLIC;
}

export interface Competitor {
  slug: string;
  name: string;
  sourceUrl: string;
  lastVerified: string; // YYYY-MM-DD
  metaDescription: string;
  summary: string;
  rows: CompareRow[];
  betterFitForCompetitor: string;
  betterFitForOnlineViewing: string;
}

export const ONLINE_VIEWING_SUMMARY_ROW = {
  pricing: "Free: 1 video, once · Starter £19/mo (5 videos) · Pro £49/mo (15 videos + AI establishing shot) · Agency £149/mo (50 videos)",
  input: "Listing URL (Rightmove, Foxtons) or photo upload",
  narration: "Yes — full narration voice library, chosen per video",
  turnaround: "A few minutes",
};

export const COMPETITORS: Competitor[] = [
  {
    slug: "betterspace",
    name: "BetterSpace",
    sourceUrl: "https://www.betterspace.ai/ai-real-estate-video",
    lastVerified: "2026-09-16",
    metaDescription:
      "A factual comparison of Online Viewing and BetterSpace for turning property listing photos into narrated video — pricing, features, and turnaround compared.",
    summary:
      "BetterSpace turns property photos or a pasted Zillow/Rightmove link into a narrated video, and bundles in extras like AI virtual staging, an AI avatar presenter, and social scheduling across Instagram, TikTok and Facebook.",
    rows: [
      {
        label: "Pricing",
        onlineViewing: ONLINE_VIEWING_SUMMARY_ROW.pricing,
        competitor: "Free: 2 videos/mo, up to 10 staged photos · Premium from $29/mo",
      },
      {
        label: "Input method",
        onlineViewing: ONLINE_VIEWING_SUMMARY_ROW.input,
        competitor: "Photos, or a pasted Zillow/Rightmove/website link",
      },
      {
        label: "Narration / voice",
        onlineViewing: ONLINE_VIEWING_SUMMARY_ROW.narration,
        competitor: "Yes — automatic narration with on-screen captions",
      },
      {
        label: "Turnaround",
        onlineViewing: ONLINE_VIEWING_SUMMARY_ROW.turnaround,
        competitor: "Under 15 minutes (their claim)",
      },
      {
        label: "Beyond video",
        onlineViewing: "Focused on narrated video only",
        competitor: "Also offers AI virtual staging, an AI avatar presenter, and multi-platform social scheduling",
      },
      {
        label: "Real vs. AI-altered photos",
        onlineViewing: "Animates the real photos you provide — no AI-generated or staged imagery",
        competitor: "Offers AI virtual staging, which can alter or add to how a room actually looks",
      },
    ],
    betterFitForCompetitor:
      "If you want one tool that also handles virtual staging, an AI presenter avatar, and scheduling posts across social platforms — not just the video itself — BetterSpace's broader feature set covers more of that in one place.",
    betterFitForOnlineViewing:
      "If you want the video to reflect the property exactly as photographed — with no AI-staged or altered imagery — and you're specifically working UK listings (Rightmove/Foxtons) or Airbnb, Online Viewing is built around that narrower, more literal use case.",
  },
  {
    slug: "videotour-ai",
    name: "VideoTour.ai",
    sourceUrl: "https://videotour.ai/",
    lastVerified: "2026-09-16",
    metaDescription:
      "A factual comparison of Online Viewing and VideoTour.ai for turning property listing photos into video — pricing tiers, narration, and turnaround compared.",
    summary:
      "VideoTour.ai converts uploaded property photos (up to 60) into a video with pan/zoom motion, music, and captions, serving real estate agents, hotels, and Airbnb hosts across four pricing tiers.",
    rows: [
      {
        label: "Pricing",
        onlineViewing: ONLINE_VIEWING_SUMMARY_ROW.pricing,
        competitor:
          "Free: 1 video · Independent $29/mo (10 videos) · Agency $59/mo (40 videos) · Enterprise $99/mo (200 videos) · 30% off annual",
      },
      {
        label: "Input method",
        onlineViewing: ONLINE_VIEWING_SUMMARY_ROW.input,
        competitor: "Photo upload only (up to 60 photos) — no listing URL import",
      },
      {
        label: "Narration / voice",
        onlineViewing: ONLINE_VIEWING_SUMMARY_ROW.narration,
        competitor: NOT_PUBLIC,
      },
      {
        label: "Turnaround",
        onlineViewing: ONLINE_VIEWING_SUMMARY_ROW.turnaround,
        competitor: "Minutes (a customer testimonial cites 5 minutes for 6 photos)",
      },
      {
        label: "Highest published plan",
        onlineViewing: "Agency: 50 videos/mo for £149/mo",
        competitor: "Enterprise: 200 videos/mo for $99/mo",
      },
    ],
    betterFitForCompetitor:
      "If you need a high monthly video volume above what Online Viewing's plans cover, VideoTour.ai's Enterprise tier (200 videos/mo) has more headroom than Online Viewing's Agency plan (50 videos/mo).",
    betterFitForOnlineViewing:
      "VideoTour.ai's own site advertises captions but doesn't mention spoken narration, and it only accepts uploaded photos, not a listing URL. If a spoken voiceover matters, or you'd rather paste a Rightmove link than manually upload photos, Online Viewing covers both.",
  },
  {
    slug: "real-estate-video-lab",
    name: "Real Estate Video Lab",
    sourceUrl: "https://realestatevideolab.com/",
    lastVerified: "2026-09-16",
    metaDescription:
      "A factual comparison of Online Viewing and Real Estate Video Lab for turning a Zillow or Rightmove listing into a narrated video.",
    summary:
      "Real Estate Video Lab takes a Zillow or Rightmove listing URL and generates an AI-narrated video automatically, currently on a free/beta access model with limited signup spots.",
    rows: [
      {
        label: "Pricing",
        onlineViewing: ONLINE_VIEWING_SUMMARY_ROW.pricing,
        competitor: "Free/beta access, described as \"limited spots available\" — no public standard paid tier found",
      },
      {
        label: "Input method",
        onlineViewing: ONLINE_VIEWING_SUMMARY_ROW.input,
        competitor: "Zillow or Rightmove listing URL only — no direct photo upload found",
      },
      {
        label: "Narration / voice",
        onlineViewing: ONLINE_VIEWING_SUMMARY_ROW.narration,
        competitor: "Yes — described as \"emotional narration\"",
      },
      {
        label: "Turnaround",
        onlineViewing: ONLINE_VIEWING_SUMMARY_ROW.turnaround,
        competitor: "15–30 minutes (their claim)",
      },
      {
        label: "Photo-only listings (e.g. Airbnb, FSBO)",
        onlineViewing: "Supported — upload photos directly, no listing URL required",
        competitor: "Not supported based on their public site — a listing URL appears to be required",
      },
    ],
    betterFitForCompetitor:
      "As of this writing, Real Estate Video Lab is offering free beta access — if that's still open when you check, it's currently the cheaper option, though a free/beta model isn't guaranteed to stay that way.",
    betterFitForOnlineViewing:
      "Real Estate Video Lab requires a Zillow or Rightmove listing URL — there's no public option to upload photos directly. If you're marketing an Airbnb, a private sale, or anything without a portal listing, Online Viewing's photo-upload flow covers that; Real Estate Video Lab's public site doesn't appear to.",
  },
];

export function getCompetitorBySlug(slug: string): Competitor | undefined {
  return COMPETITORS.find((c) => c.slug === slug);
}

/** A tool included in the roundup page but without its own dedicated
 * head-to-head page (either less directly comparable, or with too little
 * publicly verifiable data for a full side-by-side). */
export interface RoundupExtra {
  name: string;
  sourceUrl: string;
  bestFor: string;
  pricing: string | typeof NOT_PUBLIC;
  input: string;
  narration: string | typeof NOT_PUBLIC;
}

export const ROUNDUP_EXTRAS: RoundupExtra[] = [
  {
    name: "PhotoAIVideo",
    sourceUrl: "https://www.photoaivideo.com/ai-listing-video-maker-for-airbnb",
    bestFor: "Airbnb / short-term rental hosts specifically",
    pricing: "Free tier available · paid pricing not publicly listed",
    input: "Photo upload",
    narration: "Yes — amenity-aware narration",
  },
];
