# Listing Video AI

Paste a property listing URL, get back a narrated promo video — scraped
listing photos animated into short clips, no talking avatar, just voiceover.

## Pipeline

```
Listing URL
  → scrape        (src/lib/scrapers)       listing data, photos, floorplan
                                            URL, lat/lng
  → script        (src/lib/pipeline/scenePlan.ts, Claude, vision)
                                            looks at the actual floorplan +
                                            photos to order rooms like a real
                                            walkthrough, adds a satellite →
                                            street-view intro if configured,
                                            picks continuity-aware camera
                                            motion, closes on an orbit reveal
  → narration      (src/lib/clients/inworld.ts)
                                            TTS audio per scene
  → animate        (src/lib/clients/kie.ts)
                                            image-to-video clip per scene
  → assemble       (src/lib/pipeline/assemble.ts, ffmpeg)
                                            mux clip+audio+text per scene,
                                            concat into final MP4
```

### Scene planning: what it can and can't do

The script step feeds Claude the actual floorplan and listing photos (not
just text) and asks it to order rooms the way a visitor would walk through
them, match a garden/terrace photo if one exists, and choose camera motions
that feel continuous scene-to-scene, closing on an orbit/180° reveal of the
exterior. If `GOOGLE_MAPS_API_KEY` is set and the listing has coordinates,
it also prepends two establishing shots — a satellite zoom-in and a
Street View shot — before the walkthrough.

**What this is not**: a single continuous "drone flight" through the
property. Every scene is Kling animating one static photo — there's no way
to fly the camera from one photo into a different one, because that would
need an actual 3D reconstruction of the space (NeRF/Gaussian splatting from
many photos), which is a different, much heavier pipeline than this one.
What's here sells continuity through room order + matched camera motion
across cuts, not a literal unbroken shot.

Each stage is its own API route so the UI can show progress and so any
stage can be retried independently:

| Route | What it does |
|---|---|
| `POST /api/projects` | Create a project from a `sourceUrl`, scrape it |
| `GET /api/projects/:id` | Fetch current project state |
| `POST /api/projects/:id/script` | Generate the scene plan (Claude) |
| `POST /api/projects/:id/narration` | Synthesize narration audio (Inworld) |
| `POST /api/projects/:id/animate` | Submit each scene to kie.ai |
| `GET /api/projects/:id/animate/status` | Poll kie.ai jobs, download finished clips |
| `POST /api/projects/:id/animate/retry` | Resubmit one failed scene (`{ sceneId }`) without re-billing the rest |
| `POST /api/projects/:id/assemble` | Stitch the final video with ffmpeg |

`src/app/page.tsx` is a minimal UI that walks a project through all of the
above and shows the result.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in ANTHROPIC_API_KEY, KIE_API_KEY, INWORLD_API_KEY
npm run dev
```

ffmpeg must be installed on the machine running the assemble step
(`brew install ffmpeg` on macOS) — it's not an npm dependency, `fluent-ffmpeg`
just shells out to the system binary.

## Status

- **Scraping**: `src/lib/scrapers/rightmove.ts` pulls Rightmove's embedded
  `window.__PAGE_MODEL` JSON (a "flatted"-style deduplicated array — see
  `decodeFlatted` in that file) — real, verified against a live listing, but
  unofficial (check Rightmove's ToS before relying on it at scale; the
  encoding scheme can change without notice). `generic.ts` is an OG-tag
  fallback for any other site — works everywhere but only reliably gets
  title/description/photos, not price/beds/baths. Add a new adapter per site
  as needed (`src/lib/scrapers/index.ts` is the registry).
- **kie.ai client** (`src/lib/clients/kie.ts`): real, verified against live
  Kling 2.6 jobs (12/12 clips generated on a real listing) — `POST
  /api/v1/jobs/createTask` → poll `GET /api/v1/jobs/recordInfo`. A single
  failed scene (e.g. insufficient credits) doesn't require re-submitting
  (and re-billing) the rest — `POST /api/projects/:id/animate/retry` with
  `{ sceneId }` resubmits just one.
- **Google Maps establishing shots** (`src/lib/clients/googleMaps.ts`):
  real, but untested against a live key — the URL-building is
  straightforward (Static Maps + Street View Static are simple GET
  endpoints), the main risk is API key setup on your Google Cloud project
  (enable both APIs + billing) rather than the code. Entirely optional —
  `isGoogleMapsConfigured()` gates it off cleanly when no key is set.
- **Inworld client** (`src/lib/clients/inworld.ts`): real, matches Inworld's
  TTS docs — `POST /tts/v1/voice` with `Authorization: Basic <key>` (the key
  Inworld issues is already the Basic-auth credential, no extra encoding).
  Default voice is `Dennis`; call `listVoices()` (exported from the same
  file) to see what's actually available on your account and set
  `INWORLD_VOICE_ID` accordingly.
- **Storage**: projects are JSON files in `data/projects/`, media in
  `public/media/`. Fine for local dev / a single-operator tool; swap for a
  real DB + object storage (S3/R2) before multi-user or serverless
  deployment — this has no locking and serverless disks are ephemeral.
- **Assembly**: raw ffmpeg (concat + `drawtext` for on-screen text) —
  verified end-to-end on a real 12-scene listing. `drawtext` needs an ffmpeg
  build with libfreetype/fontconfig; Homebrew's default formula doesn't
  always include it (`ffmpeg -filters | grep drawtext` to check). The
  assemble step detects this and skips text overlays gracefully rather than
  failing — if you want text, `brew install ffmpeg` with a build that
  includes libfreetype, or use a static binary that does. For branded
  lower-thirds, animated captions, or a logo watermark beyond what
  `drawtext` can do, swap this step for
  [Remotion](https://www.remotion.dev/) (React-based video composition) —
  much easier to art-direct than ffmpeg filter chains.

## Prompts

The scene-plan system prompt lives in `src/lib/pipeline/scenePlan.ts`, the
kie.ai animation prompt template in `src/lib/pipeline/videoPrompt.ts` — both
are meant to be tuned, not treated as final.
