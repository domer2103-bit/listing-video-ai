import { ListingData, Scene } from "../types";

const MOTION_PHRASING: Record<Scene["cameraMotion"], string> = {
  "slow-push-in": "a slow push-in, gently moving closer",
  "pan-left": "a smooth pan from right to left",
  "pan-right": "a smooth pan from left to right",
  "orbit-left": "a subtle orbit to the left, as if walking around the space",
  "orbit-right": "a subtle orbit to the right, as if walking around the space",
  "drone-rise": "a gentle upward drone-style rise",
  "zoom-in": "a fast, dramatic zoom inward, as if rushing down from high altitude",
  static: "minimal motion, a barely-perceptible slow drift",
};

/**
 * Builds the kie.ai (Kling) image-to-video prompt for one scene.
 *
 * Kling's kie.ai endpoint has no separate negative_prompt field, so
 * constraints that would normally go there are folded into the prompt
 * itself as explicit "do not" instructions.
 */
export function buildVideoPrompt(scene: Scene, listing: ListingData): string {
  if (scene.kind === "establishing") {
    return [
      `Aerial/street-level real estate establishing shot near ${listing.address || "the property"}.`,
      `Camera performs ${MOTION_PHRASING[scene.cameraMotion]} over 4 seconds.`,
      `Photorealistic, natural lighting, no added people, no text, no logos, no watermarks.`,
      `Preserve the original geography and buildings exactly as shown in the source image.`,
      `Do not distort geometry, invent structures, add floating objects, or shift the lighting unnaturally.`,
    ].join(" ");
  }

  const style = inferPropertyStyle(listing);
  return [
    `Photorealistic real estate ${scene.roomType ?? "interior"} shot of a ${style} home.`,
    `Camera performs ${MOTION_PHRASING[scene.cameraMotion]} over 4 seconds, smooth and subtle.`,
    `Natural lighting matching the source photo, no added people, no text, no logos, no watermarks.`,
    `Preserve the original architecture, furniture and layout exactly as shown in the source image.`,
    `Real-estate listing commercial quality, stable motion.`,
    `Do not distort geometry, invent extra rooms, add floating objects, or shift the lighting unnaturally.`,
  ].join(" ");
}

function inferPropertyStyle(listing: ListingData): string {
  const text = `${listing.address} ${listing.description}`.toLowerCase();
  if (text.includes("victorian")) return "Victorian";
  if (text.includes("modern") || text.includes("new build")) return "modern";
  if (text.includes("period")) return "period";
  if (text.includes("apartment") || text.includes("flat")) return "contemporary apartment";
  return "well-presented";
}
