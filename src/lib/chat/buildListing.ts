import { ChatDraft, ListingData } from "../types";

/** Turns a completed chat draft into the same ListingData shape the
 * scraper produces, so it can flow into the existing script/narration/
 * animate/assemble pipeline unchanged. */
export function buildListingFromDraft(draft: ChatDraft): ListingData {
  if (draft.scrapedListing) return draft.scrapedListing;

  const hints = draft.photos
    .map((p, i) => (p.roomType ? `Photo ${i}: ${p.roomType}` : null))
    .filter((s): s is string => Boolean(s))
    .join("; ");

  return {
    sourceUrl: "manual-upload",
    address: draft.address ?? "",
    price: draft.price ?? "",
    bedrooms: draft.bedrooms,
    bathrooms: draft.bathrooms,
    sqft: draft.sqft,
    description: hints ? `${draft.description ?? ""}\n\nPhoto guide (user-provided): ${hints}`.trim() : draft.description ?? "",
    photos: draft.photos.map((p) => p.url),
  };
}
