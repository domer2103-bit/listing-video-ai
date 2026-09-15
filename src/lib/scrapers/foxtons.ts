import * as cheerio from "cheerio";
import { ListingData } from "../types";

/**
 * Foxtons-specific scraper.
 *
 * Foxtons (a Next.js app) embeds the full listing as JSON in a
 * `<script id="__NEXT_DATA__">` tag at `props.pageProps.propertyDetail` —
 * a clean, complete object (lat/lng, floorplan, bedrooms/bathrooms, floor
 * area, price, description, photos), no decoding scheme needed unlike
 * Rightmove's flatted array.
 *
 * This is unofficial and undocumented — Foxtons' terms of service restrict
 * automated scraping, and both the `__NEXT_DATA__` marker and the object
 * shape can change without notice.
 */
export async function scrapeFoxtons(url: string): Promise<ListingData> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; ListingVideoBot/1.0)" },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch Foxtons page: ${res.status}`);
  }
  const html = await res.text();
  const $ = cheerio.load(html);

  const raw = $("script#__NEXT_DATA__").html();
  if (!raw) {
    throw new Error("Could not find __NEXT_DATA__ on Foxtons page — layout may have changed");
  }

  const nextData = JSON.parse(raw);
  const p = nextData.props?.pageProps?.propertyDetail;
  if (!p) {
    throw new Error("Foxtons page JSON has no propertyDetail — layout may have changed");
  }

  const photos: string[] = (p.photos ?? []).map((img: { src?: string }) => img?.src).filter(Boolean);

  const location =
    typeof p.latitude === "number" && typeof p.longitude === "number"
      ? { lat: p.latitude, lng: p.longitude }
      : undefined;

  const address = [p.address?.addressLine1, p.town, p.postcode?.name].filter(Boolean).join(", ");

  const price =
    typeof p.priceFrom === "number"
      ? `${p.priceAskingType && p.priceAskingType !== "FIXED" ? `${p.priceAskingType} ` : ""}£${new Intl.NumberFormat(
          "en-GB"
        ).format(p.priceFrom)}`
      : "";

  return {
    sourceUrl: url,
    address,
    price,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    sqft: p.floorArea,
    description: p.description ?? "",
    photos: photos.slice(0, 12),
    floorplanUrl: p.floorplan?.src,
    location,
    agent: {
      name: p.office?.name,
      agency: "Foxtons",
      phone: p.office?.phone,
    },
  };
}
