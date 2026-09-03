import { z } from "zod";
import { nanoid } from "nanoid";
import { getAnthropicClient } from "../clients/anthropic";
import { ListingData, Scene } from "../types";
import {
  isGoogleMapsConfigured,
  buildSatelliteImageUrl,
  buildStreetViewImageUrl,
} from "../clients/googleMaps";

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

function buildSystemPrompt(opts: { hasFloorplan: boolean; hasEstablishing: boolean }): string {
  return `You are a real estate video director. You are given the listing's
data plus real images: ${opts.hasEstablishing ? "an aerial/satellite view, a street-view photo, " : ""}${
    opts.hasFloorplan ? "a floorplan, " : ""
  }and a set of numbered interior/exterior photos. Look at the actual images
— don't guess room order from text alone.

${
  opts.hasEstablishing
    ? `ESTABLISHING SHOTS (required, always first):
Output exactly two "establishing" scenes first, in this order:
1. establishingView: "satellite" — cameraMotion "zoom-in". narration is a
   punchy one-sentence hook naming the location. onScreenText carries the
   price + address (this is the opening hook the viewer sees first).
2. establishingView: "streetview" — cameraMotion "zoom-in". narration
   transitions from the street into arriving at the property ("Right in the
   heart of..." / "Arriving at..." style, one sentence).
`
    : `No aerial/satellite or street-view images were provided. Do NOT
output any scene with "kind": "establishing" — every scene must be
"kind": "interior", starting directly with the property photos.
`
}${
    opts.hasFloorplan
      ? `ROOM ORDER FROM THE FLOORPLAN (important):
Study the floorplan image to understand the actual layout — which rooms
connect to which, where the entrance is. Order the interior scenes the way
a visitor would naturally walk through the property: entrance/hallway
first, then principal reception/kitchen spaces, then the bedroom wing,
then any secondary rooms (media/utility/etc). Match each numbered photo to
the room it depicts using both the photo itself and the floorplan layout —
photos are NOT necessarily provided in walkthrough order, re-order them.
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
feature (price, bedrooms, or standout detail). onScreenText carries
price + address.
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
narration is a call to action (book a viewing / contact the agent).

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
- onScreenText: short label for text overlay (feature callout, price+area
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

export async function generateScenePlan(listing: ListingData): Promise<Scene[]> {
  const client = getAnthropicClient();

  const hasEstablishing = isGoogleMapsConfigured() && Boolean(listing.location);
  const hasFloorplan = Boolean(listing.floorplanUrl);

  const content: Array<
    | { type: "text"; text: string }
    | { type: "image"; source: { type: "url"; url: string } }
  > = [
    {
      type: "text",
      text: `Listing data:\n${JSON.stringify(
        {
          address: listing.address,
          price: listing.price,
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

  if (hasEstablishing && listing.location) {
    content.push({ type: "text", text: "AERIAL/SATELLITE VIEW:" });
    content.push({ type: "image", source: { type: "url", url: buildSatelliteImageUrl(listing.location) } });
    content.push({ type: "text", text: "STREET VIEW:" });
    content.push({ type: "image", source: { type: "url", url: buildStreetViewImageUrl(listing.location) } });
  }

  if (hasFloorplan && listing.floorplanUrl) {
    content.push({ type: "text", text: "FLOORPLAN:" });
    content.push({ type: "image", source: { type: "url", url: listing.floorplanUrl } });
  }

  listing.photos.forEach((url, i) => {
    content.push({ type: "text", text: `PHOTO ${i}:` });
    content.push({ type: "image", source: { type: "url", url } });
  });

  content.push({ type: "text", text: "Produce the scene plan now." });

  // max_tokens caps thinking + text combined on Sonnet 5 (adaptive thinking
  // is on by default) — with the floorplan/photo vision analysis this needs
  // real headroom, or the JSON output gets truncated mid-scene.
  const response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 8192,
    system: buildSystemPrompt({ hasFloorplan, hasEstablishing }),
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

    if (s.kind === "establishing" && listing.location) {
      return {
        ...base,
        kind: "establishing",
        sourceImageUrl:
          s.establishingView === "satellite"
            ? buildSatelliteImageUrl(listing.location)
            : buildStreetViewImageUrl(listing.location),
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
