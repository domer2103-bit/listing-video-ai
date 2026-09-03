import * as cheerio from "cheerio";
import { ListingData } from "../types";

/**
 * Best-effort fallback scraper for any listing page: reads Open Graph /
 * meta tags (og:title, og:description, og:image + duplicates) which most
 * listing sites publish for link-preview purposes. Good enough for a demo,
 * but won't reliably get price/beds/baths since those aren't standardized
 * in meta tags — expect gaps for sites without a dedicated adapter.
 */
export async function scrapeGeneric(url: string): Promise<ListingData> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; ListingVideoBot/1.0)" },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch listing page: ${res.status}`);
  }
  const html = await res.text();
  const $ = cheerio.load(html);

  const meta = (name: string) =>
    $(`meta[property="${name}"]`).attr("content") ?? $(`meta[name="${name}"]`).attr("content");

  const photos = new Set<string>();
  $('meta[property="og:image"]').each((_, el) => {
    const content = $(el).attr("content");
    if (content) photos.add(content);
  });
  // Fall back to large <img> tags on the page if og:image gave us little.
  if (photos.size < 3) {
    $("img").each((_, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src");
      if (src && /\.(jpg|jpeg|png|webp)(\?|$)/i.test(src)) {
        photos.add(new URL(src, url).toString());
      }
    });
  }

  const title = meta("og:title") ?? $("title").text() ?? "";
  const description = meta("og:description") ?? "";
  const priceMatch = html.match(/[£$€]\s?[\d,]{3,}/);

  return {
    sourceUrl: url,
    address: title.trim(),
    price: priceMatch?.[0] ?? "",
    description: description.trim(),
    photos: Array.from(photos).slice(0, 12),
  };
}
