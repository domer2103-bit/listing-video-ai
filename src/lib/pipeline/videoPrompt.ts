import { ListingData } from "../types";

/**
 * Prompt for the Veo3 first/last-frame zoom clip: whole-earth view (first
 * frame) descending into a close-up satellite view of the property (last
 * frame). Anchoring both endpoints keeps the model interpolating between
 * two real images instead of freely hallucinating an open-ended "zoom in".
 */
export function buildEarthZoomPrompt(listing: ListingData): string {
  return [
    `Cinematic aerial dive: camera starts from high orbital altitude looking down at planet Earth, then performs one continuous, smooth, accelerating descent through the atmosphere and clouds, diving toward a residential property near ${listing.address || "the property"}, ending in a close-up aerial view directly above the building shown in the final frame.`,
    `Photorealistic satellite and aerial cinematography, natural lighting, no added people, no text, no logos, no watermarks.`,
    `Smooth continuous motion throughout, no jump cuts, no sudden stops, no orbiting or spinning — a straight descent only.`,
    `Preserve the real geography and buildings shown in the source images exactly, do not invent structures or distort landmasses.`,
  ].join(" ");
}

/**
 * Prompt for the kie.ai orbit clip that picks up where the Veo3 earth-zoom
 * descent leaves off — a real, detailed satellite close-up (not a flat
 * low-zoom map), which is the kind of shot Kling handles reliably.
 */
export function buildSatelliteOrbitPrompt(listing: ListingData): string {
  return [
    `Aerial satellite view of a residential property near ${listing.address || "the property"}.`,
    `Camera performs a slow, smooth orbit, continuously circling the property at a fixed low altitude while keeping it centered in frame.`,
    `Photorealistic, natural lighting matching the source image, no added people, no text, no logos, no watermarks.`,
    `Preserve the original architecture, streets and surrounding layout exactly as shown in the source image.`,
    `Real-estate listing commercial quality, stable smooth motion, no zooming, no wobble.`,
    `Do not distort geometry, invent extra buildings, add floating objects, or shift the lighting unnaturally.`,
  ].join(" ");
}
