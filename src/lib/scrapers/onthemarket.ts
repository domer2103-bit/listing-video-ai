import * as cheerio from "cheerio";
import { ListingData } from "../types";

/**
 * OnTheMarket-specific scraper.
 *
 * OnTheMarket (a Next.js app) embeds the full listing as JSON in a
 * `<script id="__NEXT_DATA__">` tag at
 * `props.initialReduxState.property` — most fields sit directly on that
 * object, except price, which only appears inside a further JSON-encoded
 * string at `property.headerData.dataLayer`.
 *
 * This is unofficial and undocumented — OnTheMarket's terms of service
 * restrict automated scraping, and both the `__NEXT_DATA__` marker and the
 * object shape can change without notice. As of testing, listing pages
 * are fully server-rendered (confirmed to work with both a bot-style and a
 * realistic browser User-Agent) — this previously was not the case.
 */
export async function scrapeOnTheMarket(url: string): Promise<ListingData> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; ListingVideoBot/1.0)" },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch OnTheMarket page: ${res.status}`);
  }
  const html = await res.text();
  const $ = cheerio.load(html);

  const raw = $("script#__NEXT_DATA__").html();
  if (!raw) {
    throw new Error("Could not find __NEXT_DATA__ on OnTheMarket page — layout may have changed");
  }

  const nextData = JSON.parse(raw);
  const p = nextData.props?.initialReduxState?.property;
  if (!p) {
    throw new Error("OnTheMarket page JSON has no property data — layout may have changed");
  }

  let price = "";
  try {
    const dataLayer = JSON.parse(p.headerData?.dataLayer ?? "{}");
    if (dataLayer.price) price = `£${dataLayer.price}`;
  } catch {
    // price stays empty if the embedded dataLayer JSON is malformed
  }

  const photos: string[] = (p.images ?? [])
    .map((img: { largeUrl?: string }) => img?.largeUrl)
    .filter(Boolean);

  const location =
    typeof p.location?.lat === "number" && typeof p.location?.lon === "number"
      ? { lat: p.location.lat, lng: p.location.lon }
      : undefined;

  return {
    sourceUrl: url,
    address: p.displayAddress ?? "",
    price,
    bedrooms: typeof p.bedrooms === "number" ? p.bedrooms : undefined,
    bathrooms: typeof p.bathrooms === "number" ? p.bathrooms : undefined,
    description: (p.description ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    photos: photos.slice(0, 12),
    floorplanUrl: p.floorplans?.[0]?.largeUrl,
    location,
    agent: {
      name: p.agent?.name,
      agency: p.agent?.companyName,
      phone: p.agent?.telephone,
    },
  };
}
