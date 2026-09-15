import * as cheerio from "cheerio";
import { ListingData } from "../types";

/**
 * Savills-specific scraper.
 *
 * Savills listing pages are actually served from search.savills.com (the
 * www.savills.co.uk site redirects there), a Next.js app that embeds the
 * full listing as JSON in a `<script id="__NEXT_DATA__">` tag at
 * `props.initialReduxState.propertyDetail.property` — a clean, complete
 * object (lat/lng, floorplan, bedrooms/bathrooms, formatted price,
 * description, photos, office contact details).
 *
 * This is unofficial and undocumented — Savills' terms of service
 * restrict automated scraping, and both the `__NEXT_DATA__` marker and
 * the object shape can change without notice.
 */
export async function scrapeSavills(url: string): Promise<ListingData> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; ListingVideoBot/1.0)" },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch Savills page: ${res.status}`);
  }
  const html = await res.text();
  const $ = cheerio.load(html);

  const raw = $("script#__NEXT_DATA__").html();
  if (!raw) {
    throw new Error("Could not find __NEXT_DATA__ on Savills page — layout may have changed");
  }

  const nextData = JSON.parse(raw);
  const p = nextData.props?.initialReduxState?.propertyDetail?.property;
  if (!p) {
    throw new Error("Savills page JSON has no property data — layout may have changed");
  }

  const photos: string[] = (p.ImagesGallery ?? [])
    .map((img: { ImageUrl_L?: string }) => img?.ImageUrl_L)
    .filter(Boolean);

  const location =
    typeof p.Latitude === "number" && typeof p.Longitude === "number"
      ? { lat: p.Latitude, lng: p.Longitude }
      : undefined;

  const longDescriptionBody = Array.isArray(p.LongDescription) ? p.LongDescription[0]?.Body : undefined;
  const description = (longDescriptionBody ?? p.Description ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const office = p.PrimaryAgent?.Office;

  return {
    sourceUrl: url,
    address: [p.AddressLine1, p.AddressLine2].filter(Boolean).join(", "),
    price: p.DisplayPriceText ?? "",
    bedrooms: typeof p.Bedrooms === "number" ? p.Bedrooms : undefined,
    bathrooms: typeof p.Bathrooms === "number" ? p.Bathrooms : undefined,
    sqft: typeof p.SizeSqFt === "number" ? p.SizeSqFt : undefined,
    description,
    photos: photos.slice(0, 12),
    floorplanUrl: p.FloorPlanGallery?.[0]?.ImageUrl_L,
    location,
    agent: {
      name: office?.OfficeName,
      agency: "Savills",
      phone: office?.OfficePhoneNumber,
    },
  };
}
