import { ListingData } from "../types";

/**
 * Purplebricks-specific scraper.
 *
 * Purplebricks is a Next.js App Router site — unlike the Pages Router
 * sites (OnTheMarket, Savills), there's no single __NEXT_DATA__ blob.
 * Instead the listing data streams down as React Server Component
 * "flight" chunks: a series of `self.__next_f.push([1, "<id>:<data>"])`
 * calls. Each chunk is a JS string literal (needs unescaping), chunks are
 * concatenated into one stream, then split back into `<id>: <content>`
 * records. Large string values (like the description) are hoisted into
 * their own chunk and referenced elsewhere as `"$<id>"`.
 *
 * This is unofficial and undocumented — Purplebricks' terms of service
 * restrict automated scraping, and this parsing approach is tied to
 * Next.js's current flight-protocol wire format, which could change
 * without notice. No numeric bedroom/bathroom fields or floorplan URL are
 * exposed in the embedded data — bedroom count is regex-extracted from
 * the title text, bathrooms and floorplan are left unset.
 */
export async function scrapePurplebricks(url: string): Promise<ListingData> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; ListingVideoBot/1.0)" },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch Purplebricks page: ${res.status}`);
  }
  const html = await res.text();

  const chunkMap = parseFlightChunks(html);

  let propertyChunkContent: string | undefined;
  for (const content of chunkMap.values()) {
    if (content.includes('"property":{')) {
      propertyChunkContent = content;
      break;
    }
  }
  if (!propertyChunkContent) {
    throw new Error("Could not find embedded property data on Purplebricks page — layout may have changed");
  }

  const propertyJson = extractBalancedJson(propertyChunkContent, propertyChunkContent.indexOf('"property":{') + '"property":'.length);
  const p = JSON.parse(propertyJson);

  const description = resolveFlightString(p.description, chunkMap);

  const bedroomsMatch = /(\d+)\s*bedroom/i.exec(p.title ?? "");
  const bedrooms = bedroomsMatch ? Number(bedroomsMatch[1]) : undefined;

  const photos: string[] = (p.images ?? [])
    .map((img: { url?: string }) => img?.url)
    .filter(Boolean);

  return {
    sourceUrl: url,
    address: p.address ?? "",
    price: typeof p.marketPrice === "number" ? `£${p.marketPrice.toLocaleString("en-GB")}` : "",
    bedrooms,
    description,
    photos: photos.slice(0, 12),
    location:
      typeof p.latitude === "number" && typeof p.longitude === "number"
        ? { lat: p.latitude, lng: p.longitude }
        : undefined,
  };
}

/** Extracts and decodes every `self.__next_f.push([1, "..."])` flight
 * chunk from the raw HTML, concatenates them in stream order, then splits
 * back into `<id> -> content` records at each `\n<hexid>:` boundary. */
function parseFlightChunks(html: string): Map<string, string> {
  const rawChunks = [...html.matchAll(/self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g)].map((m) => m[1]);
  const decoded = rawChunks.map((c) => JSON.parse(`"${c}"`) as string).join("");

  const chunkMap = new Map<string, string>();
  const parts = decoded.split(/\n(?=[0-9a-f]+:)/);
  for (const part of parts) {
    const match = /^([0-9a-f]+):([\s\S]*)$/.exec(part);
    if (match) chunkMap.set(match[1], match[2]);
  }
  return chunkMap;
}

/** Flight string values are either a plain JSON value, or a reference
 * `"$<id>"` to another chunk. Referenced chunks holding long text are
 * prefixed `T<hexlen>,<text>` — strip that framing if present. */
function resolveFlightString(value: unknown, chunkMap: Map<string, string>): string {
  if (typeof value !== "string") return "";
  const ref = /^\$([0-9a-f]+)$/.exec(value);
  if (!ref) return value;

  const chunk = chunkMap.get(ref[1]);
  if (!chunk) return "";
  const textMatch = /^T[0-9a-f]+,([\s\S]*)$/.exec(chunk);
  return textMatch ? textMatch[1] : chunk;
}

/** Scans forward from `startIndex` (which must point at the opening `{`)
 * and returns the substring up to its matching closing brace, respecting
 * string literals and escapes so braces inside strings don't confuse it. */
function extractBalancedJson(text: string, startIndex: number): string {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = startIndex; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(startIndex, i + 1);
    }
  }
  throw new Error("Unbalanced JSON while parsing Purplebricks property data");
}
