import { z } from "zod";
import { nanoid } from "nanoid";
import { readFile } from "fs/promises";
import path from "path";
import { getAnthropicClient } from "../clients/anthropic";
import { Audience, ListingData, Scene } from "../types";
import {
  isGoogleMapsConfigured,
  buildSatelliteImageUrl,
  buildStreetViewImageUrl,
  geocodeAddress,
  findNearbyPlaces,
  NearbyPlace,
} from "../clients/googleMaps";

type SupportedImageType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

const cameraMotionEnum = z.enum([
  "slow-push-in",
  "pan-left",
  "pan-right",
  "orbit-left",
  "orbit-right",
  "drone-rise",
  "zoom-in",
  "static",
]);

const sceneSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("establishing"),
    establishingView: z.enum(["satellite", "streetview"]),
    roomType: z.string(),
    narration: z.string(),
    onScreenText: z.string().optional(),
    cameraMotion: cameraMotionEnum,
  }),
  z.object({
    kind: z.literal("interior"),
    photoIndex: z.number().int().min(0),
    roomType: z.string(),
    narration: z.string(),
    onScreenText: z.string().optional(),
    cameraMotion: cameraMotionEnum,
  }),
]);

const scenePlanSchema = z.object({
  scenes: z.array(sceneSchema),
}).refine(
  (plan) => {
    const photoIndexes = plan.scenes
      .filter((s) => s.kind === "interior")
      .map((s) => s.photoIndex);
    return new Set(photoIndexes).size === photoIndexes.length;
  },
  { message: "Scene plan reuses the same photoIndex in more than one scene" }
);

function buildSystemPrompt(opts: {
  hasFloorplan: boolean;
  hasEstablishing: boolean;
  audience: Audience;
  nearbyPlaces: NearbyPlace[];
}): string {
  const director =
    opts.audience === "airbnb"
      ? "You are a short-term rental video director, creating a promo video for an Airbnb-style listing."
      : "You are a real estate video director.";
  const isAirbnb = opts.audience === "airbnb";

  const priceRule = isAirbnb
    ? `\nDo NOT mention or display a nightly rate or price anywhere in this
video — rates change throughout the year and this video should stay
evergreen. Use the location/area name on the opening hook instead.\n`
    : "";

  const nearbyBlock =
    opts.nearbyPlaces.length > 0
      ? `\nNEARBY (real, verified — you may naturally reference one or two of
these by name, e.g. in the street-view establishing shot or the closing
scene, to give guests a feel for the area. Never invent a place that
isn't on this list, and don't force a mention into every scene):
${opts.nearbyPlaces.map((p) => `- ${p.name} (${p.category})`).join("\n")}
`
      : "";

  return `${director} You are given the listing's
data plus real images: ${opts.hasEstablishing ? "an aerial/satellite view, a street-view photo, " : ""}${
    opts.hasFloorplan ? "a floorplan, " : ""
  }and a set of numbered interior/exterior photos. Look at the actual images
— don't guess room order from text alone.
${priceRule}${nearbyBlock}
${
  opts.hasEstablishing
    ? `ESTABLISHING SHOTS (required, always first):
Output exactly two "establishing" scenes first, in this order:
1. establishingView: "satellite" — cameraMotion "zoom-in". narration is a
   punchy one-sentence hook naming the location. onScreenText carries the
   ${isAirbnb ? "location/area name" : "price + address"} (this is the
   opening hook the viewer sees first).
2. establishingView: "streetview" — cameraMotion "zoom-in". narration
   transitions from the street into arriving at the property ("Right in the
   heart of..." / "Arriving at..." style, one sentence)${
     opts.nearbyPlaces.length > 0 ? " — a good place to weave in a real nearby highlight if it fits naturally" : ""
   }.
`
    : `No aerial/satellite or street-view images were provided. Do NOT
output any scene with "kind": "establishing" — every scene must be
"kind": "interior", starting directly with the property photos.
`
}${
    opts.hasFloorplan
      ? `ROOM ORDER FROM THE FLOORPLAN (important):
Study the floorplan image and trace an actual walking path through it:
start at the front door, then move room-to-room strictly by which rooms
are physically adjacent or connected (through a door, hallway, or open
threshold) on the floorplan — like a real visitor walking the property,
never doubling back through a room already shown. Let the floorplan's
physical layout decide the order, not a generic category pattern — a room
that sits right next to the entrance should appear early even if it's a
"secondary" room type (e.g. a home cinema, study, or utility room by the
front door comes before a principal bedroom that's physically at the far
end of the house). Only fall back to a generic entrance-then-reception-
then-bedrooms grouping for rooms whose floorplan position is ambiguous or
unclear from the image. Match each numbered photo to the room it depicts
using both the photo itself and the floorplan layout — photos are NOT
necessarily provided in walkthrough order, re-order them.
`
      : `No floorplan was provided — infer a sensible walkthrough order from
the photos and description: exterior/entrance first, then main living
spaces, kitchen, bedrooms, bathrooms, any amenities, ending on the exterior.
`
  }
EACH PHOTO ONCE (critical):
Every "photoIndex" you use must be unique — never assign the same photo to
two different scenes. Look carefully at each numbered photo before
labeling it: a building exterior/facade/entrance photo is NOT the same
thing as an interior reception/living room, even if both are grand or
well-lit. Don't confuse the two.

${
  opts.hasEstablishing
    ? ""
    : `OPENING SCENE (required, first interior scene since no establishing
shots were provided): use the exterior/front-of-building photo if one
exists among the numbered photos. narration leads with the headline
feature (${isAirbnb ? "bedrooms or a standout detail" : "price, bedrooms, or standout detail"}).
onScreenText carries ${isAirbnb ? "the location/area name" : "price + address"}.
`
}GARDEN / OUTDOOR SPACE:
If any numbered photo shows a back garden, terrace, patio, or balcony,
give it its own scene, placed near the end of the interior sequence —
just before the closing shot.

CLOSING SHOT (required, always last):
The final scene must use a DIFFERENT exterior/front-of-building photo than
any used earlier (if the listing only has one exterior photo, close on the
best interior room instead — do not reuse a photo already used in an
earlier scene). cameraMotion "orbit-left" or "orbit-right" (a 180° reveal).
narration is a call to action (${
    opts.audience === "airbnb" ? "book your stay" : "book a viewing / contact the agent"
  }).

CAMERA MOTION CONTINUITY:
Choose motions so consecutive scenes feel like continuous forward movement
through the space, not a random cut — e.g. don't follow "pan-left"
immediately with "pan-right" (reads as reversing direction). Still vary
motion across the whole sequence; never repeat the same motion 3 times in
a row.

For every scene provide:
- roomType: short label, e.g. "kitchen", "primary bedroom", "exterior front"
- narration: ONE sentence, warm and concrete — describe what's actually
  visible or a real listed feature. No filler superlatives ("stunning",
  "luxurious", "must-see") unless a specific detail earns it.
- onScreenText: short label for text overlay (feature callout, ${
    isAirbnb ? "area name" : "price+area"
  }
  on the opening hook). Omit for scenes that don't need one.
- cameraMotion: slow-push-in, pan-left, pan-right, orbit-left, orbit-right,
  drone-rise, zoom-in, or static.

Keep total narration to roughly 90 seconds spoken aloud (~220 words) across
all scenes combined.

Respond with ONLY valid JSON, no prose before or after, matching exactly
one of these two shapes per scene (the field names must match exactly):

Interior scene:
{ "kind": "interior", "photoIndex": <number, the PHOTO index from above>,
  "roomType": <string>, "narration": <string>, "onScreenText": <string,
  optional>, "cameraMotion": <string> }

Establishing scene${opts.hasEstablishing ? "" : " (do not output any of these — see above)"}:
{ "kind": "establishing", "establishingView": "satellite"|"streetview",
  "roomType": <string>, "narration": <string>, "onScreenText": <string,
  optional>, "cameraMotion": <string> }

Full response shape: { "scenes": [ <scene>, <scene>, ... ] }`;
}

export async function generateScenePlan(listing: ListingData, audience: Audience = "sale"): Promise<Scene[]> {
  const client = getAnthropicClient();

  // Scraped listings usually come with lat/lng already; the chat-upload
  // flow (always true for Airbnb) never does — geocode the free-text
  // address/area as a fallback so those listings still get the
  // establishing-shot intro.
  let location = listing.location;
  if (!location && listing.address && isGoogleMapsConfigured()) {
    location = (await geocodeAddress(listing.address)) ?? undefined;
  }

  const hasEstablishing = isGoogleMapsConfigured() && Boolean(location);
  const hasFloorplan = Boolean(listing.floorplanUrl);

  const nearbyPlaces = audience === "airbnb" && location ? await findNearbyPlaces(location) : [];

  const content: Array<
    | { type: "text"; text: string }
    | { type: "image"; source: { type: "url"; url: string } }
    | { type: "image"; source: { type: "base64"; media_type: SupportedImageType; data: string } }
  > = [
    {
      type: "text",
      text: `Listing data:\n${JSON.stringify(
        {
          address: listing.address,
          ...(audience === "airbnb" ? {} : { price: listing.price }),
          bedrooms: listing.bedrooms,
          bathrooms: listing.bathrooms,
          sqft: listing.sqft,
          description: listing.description,
          photoCount: listing.photos.length,
        },
        null,
        2
      )}`,
    },
  ];

  if (hasEstablishing && location) {
    // Google's robots.txt disallows crawling /maps/api/staticmap and
    // /maps/api/streetview, and Claude's URL-based image fetch respects
    // that (400 invalid_request_error). Fetch the bytes ourselves and send
    // as base64 instead — bypasses the robots.txt check entirely.
    const [satellite, streetview] = await Promise.all([
      fetchImageAsBase64(buildSatelliteImageUrl(location)),
      fetchImageAsBase64(buildStreetViewImageUrl(location)),
    ]);
    content.push({ type: "text", text: "AERIAL/SATELLITE VIEW:" });
    content.push({ type: "image", source: { type: "base64", ...satellite } });
    content.push({ type: "text", text: "STREET VIEW:" });
    content.push({ type: "image", source: { type: "base64", ...streetview } });
  }

  if (hasFloorplan && listing.floorplanUrl) {
    content.push({ type: "text", text: "FLOORPLAN:" });
    content.push(await resolveImageContent(listing.floorplanUrl));
  }

  for (const [i, url] of listing.photos.entries()) {
    content.push({ type: "text", text: `PHOTO ${i}:` });
    content.push(await resolveImageContent(url));
  }

  content.push({ type: "text", text: "Produce the scene plan now." });

  // max_tokens caps thinking + text combined on Sonnet 5 (adaptive thinking
  // is on by default) — with the floorplan/photo vision analysis this needs
  // real headroom, or the JSON output gets truncated mid-scene.
  const response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 8192,
    system: buildSystemPrompt({ hasFloorplan, hasEstablishing, audience, nearbyPlaces }),
    messages: [{ role: "user", content }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from scene-plan generation");
  }

  if (response.stop_reason === "max_tokens") {
    throw new Error(
      "Scene-plan response was truncated (hit max_tokens) — raise max_tokens further or shorten the prompt"
    );
  }

  const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Scene-plan response did not contain JSON");
  }

  const parsed = scenePlanSchema.parse(JSON.parse(jsonMatch[0]));

  return parsed.scenes.map((s, order): Scene => {
    const base = {
      id: nanoid(),
      order,
      roomType: s.roomType,
      narration: s.narration,
      onScreenText: s.onScreenText,
      cameraMotion: s.cameraMotion,
      videoStatus: "pending" as const,
    };

    if (s.kind === "establishing" && location) {
      return {
        ...base,
        kind: "establishing",
        establishingView: s.establishingView,
        sourceImageUrl:
          s.establishingView === "satellite" ? buildSatelliteImageUrl(location) : buildStreetViewImageUrl(location),
      };
    }

    const photoIndex = s.kind === "interior" ? s.photoIndex : 0;
    return {
      ...base,
      kind: "interior",
      sourceImageUrl: listing.photos[photoIndex] ?? listing.photos[0],
    };
  });
}

const SUPPORTED_IMAGE_TYPES: SupportedImageType[] = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const EXTENSION_TO_MEDIA_TYPE: Record<string, SupportedImageType> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
};

type ImageContentBlock =
  | { type: "image"; source: { type: "url"; url: string } }
  | { type: "image"; source: { type: "base64"; media_type: SupportedImageType; data: string } };

/**
 * Claude's vision API only accepts HTTPS URLs — locally-uploaded photos
 * (chat upload flow) are served over plain http://localhost in dev, and
 * would 400 with "Only HTTPS URLs are supported." Any locally-served path
 * (starts with "/") is read straight off disk and sent as base64 instead;
 * real listing-site photo URLs pass through unchanged.
 */
async function resolveImageContent(url: string): Promise<ImageContentBlock> {
  if (!url.startsWith("/")) {
    return { type: "image", source: { type: "url", url } };
  }
  const filePath = path.join(process.cwd(), "public", url);
  const buffer = await readFile(filePath);
  const ext = path.extname(url).slice(1).toLowerCase();
  const media_type = EXTENSION_TO_MEDIA_TYPE[ext] ?? "image/jpeg";
  return { type: "image", source: { type: "base64", media_type, data: buffer.toString("base64") } };
}

async function fetchImageAsBase64(url: string): Promise<{ media_type: SupportedImageType; data: string }> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch image for vision analysis: ${url} (${res.status})`);
  }
  const contentType = res.headers.get("content-type")?.split(";")[0].trim();
  const mediaType = SUPPORTED_IMAGE_TYPES.includes(contentType as SupportedImageType)
    ? (contentType as SupportedImageType)
    : "image/png";
  const buffer = Buffer.from(await res.arrayBuffer());
  return { media_type: mediaType, data: buffer.toString("base64") };
}
