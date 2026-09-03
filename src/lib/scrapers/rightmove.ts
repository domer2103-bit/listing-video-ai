import { ListingData } from "../types";

/**
 * Rightmove-specific scraper.
 *
 * Rightmove embeds the full listing as JSON in a `window.__PAGE_MODEL = {...}`
 * script tag server-side. The payload isn't a plain object though — its
 * `data` field is a "flatted"-style deduplicated array: index 0 is the root
 * node, and every value inside an object/array is either a literal or an
 * integer index pointing at another array slot (including primitives, which
 * are stored at their own slot and referenced by index too). `decodeFlatted`
 * below resolves that back into a normal nested object.
 *
 * This is unofficial and undocumented — Rightmove's terms of service
 * restrict automated scraping, and both the `__PAGE_MODEL` marker and the
 * encoding scheme can change without notice. Confirm you're allowed to do
 * this for your use case (a licensed data feed / agent's own listings via
 * their own site is a safer bet than scraping at scale) before relying on
 * it in production.
 */
export async function scrapeRightmove(url: string): Promise<ListingData> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; ListingVideoBot/1.0)" },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch Rightmove page: ${res.status}`);
  }
  const html = await res.text();

  const match = html.match(/window\.__PAGE_MODEL\s*=\s*(\{[\s\S]*?\});\s*(?:window\.|<\/script>)/);
  if (!match) {
    throw new Error("Could not find __PAGE_MODEL on Rightmove page — layout may have changed");
  }

  const outer = JSON.parse(match[1]);
  const root =
    typeof outer.data === "string" && outer.encoding === "on"
      ? decodeFlatted(JSON.parse(outer.data))
      : outer;

  const p = root.propertyData ?? root.property ?? root;

  const photos: string[] = (p.images ?? [])
    .map((img: { url?: string }) => img?.url)
    .filter(Boolean);

  const sqftEntry = (p.sizings ?? []).find(
    (s: { unit?: string }) => s.unit === "sqft"
  );

  const floorplanUrl: string | undefined = (p.floorplans ?? []).find(
    (f: { type?: string }) => f.type === "IMAGE"
  )?.url;

  const location =
    typeof p.location?.latitude === "number" && typeof p.location?.longitude === "number"
      ? { lat: p.location.latitude, lng: p.location.longitude }
      : undefined;

  return {
    sourceUrl: url,
    address: p.address?.displayAddress ?? p.text?.pageTitle ?? "",
    price: p.prices?.primaryPrice ?? "",
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    sqft: sqftEntry?.maximumSize,
    description: (p.text?.description ?? "").replace(/<[^>]+>/g, " ").trim(),
    photos: photos.slice(0, 12),
    floorplanUrl,
    location,
    agent: {
      name: p.customer?.branchDisplayName,
      agency: p.customer?.companyTradingName,
      phone: p.customer?.telephoneNumbers?.localNumber,
    },
  };
}

/**
 * Resolves a "flatted"-style array (index 0 = root; every object/array
 * value that's an in-bounds integer is a reference to another slot) back
 * into a normal nested structure.
 */
function decodeFlatted(arr: unknown[]): Record<string, unknown> {
  const memo = new Map<number, unknown>();

  function resolve(i: number): unknown {
    if (memo.has(i)) return memo.get(i);
    const val = arr[i];

    if (Array.isArray(val)) {
      const result: unknown[] = [];
      memo.set(i, result);
      for (const v of val) {
        result.push(isRef(v) ? resolve(v) : v);
      }
      return result;
    }

    if (val && typeof val === "object") {
      const result: Record<string, unknown> = {};
      memo.set(i, result);
      for (const [k, v] of Object.entries(val)) {
        result[k] = isRef(v) ? resolve(v as number) : v;
      }
      return result;
    }

    return val;
  }

  function isRef(v: unknown): v is number {
    return typeof v === "number" && Number.isInteger(v) && v >= 0 && v < arr.length;
  }

  return resolve(0) as Record<string, unknown>;
}
