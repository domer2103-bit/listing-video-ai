/**
 * Google Maps Platform client — four APIs under one GOOGLE_MAPS_API_KEY:
 *  - Maps Static API + Street View Static API: the establishing-shot intro
 *    images (high-altitude zoom → street level).
 *  - Geocoding API: resolves a free-text address/area into lat/lng for
 *    listings that don't already have coordinates (e.g. the Airbnb
 *    chat-upload flow).
 *  - Places API (New), Nearby Search: real nearby restaurants/attractions/
 *    transit for the narration to reference by name — grounds local-area
 *    mentions in verified data instead of letting the model invent them.
 * All four need to be enabled (with billing) on the Google Cloud project.
 *
 * The key is passed as a query param on the static-image URLs — those URLs
 * get handed to kie.ai to fetch server-side, so the key is visible to
 * kie.ai's infrastructure. Fine for a personal/internal tool; for anything
 * more exposed, restrict the key by server IP (not HTTP referrer, which
 * doesn't apply to server-to-server fetches) and set a usage quota.
 *
 * Establishing shots and nearby-places lookups are skipped entirely (see
 * scenePlan.ts) when this key isn't set — no hard dependency.
 */

export function isGoogleMapsConfigured(): boolean {
  return Boolean(process.env.GOOGLE_MAPS_API_KEY);
}

function getApiKey(): string {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error("GOOGLE_MAPS_API_KEY is not set");
  return key;
}

/** High-altitude satellite view centered on the property, for the opening zoom-in. */
export function buildSatelliteImageUrl(location: { lat: number; lng: number }): string {
  return buildSatelliteImageUrlAtZoom(location, 19);
}

/** Satellite view at an arbitrary Google Maps zoom level (0 = whole earth,
 * 21 = building level) — used to build the multi-altitude "earth zoom"
 * intro sequence. */
export function buildSatelliteImageUrlAtZoom(location: { lat: number; lng: number }, zoom: number): string {
  const params = new URLSearchParams({
    center: `${location.lat},${location.lng}`,
    zoom: String(zoom),
    size: "1280x720",
    maptype: "satellite",
    key: getApiKey(),
  });
  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
}

/** Ground-level Street View image at the property's coordinates. */
export function buildStreetViewImageUrl(location: { lat: number; lng: number }): string {
  const params = new URLSearchParams({
    location: `${location.lat},${location.lng}`,
    size: "1280x720",
    fov: "80",
    source: "outdoor",
    key: getApiKey(),
  });
  return `https://maps.googleapis.com/maps/api/streetview?${params.toString()}`;
}

/** Resolves a free-text address/area into coordinates via the Geocoding
 * API — used for listings that never get a lat/lng from a scraper (e.g.
 * the Airbnb chat-upload flow, which only collects a rough area name).
 * Returns null on any failure rather than throwing, since establishing
 * shots are always an optional enhancement, never a hard requirement. */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const params = new URLSearchParams({ address, key: getApiKey() });
    const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`);
    if (!res.ok) return null;
    const data = await res.json();
    const location = data.results?.[0]?.geometry?.location;
    if (typeof location?.lat !== "number" || typeof location?.lng !== "number") return null;
    return { lat: location.lat, lng: location.lng };
  } catch {
    return null;
  }
}

export interface NearbyPlace {
  name: string;
  category: "restaurant" | "attraction" | "transport";
}

const NEARBY_SEARCH_TYPES: { type: string; category: NearbyPlace["category"] }[] = [
  { type: "restaurant", category: "restaurant" },
  { type: "tourist_attraction", category: "attraction" },
  { type: "transit_station", category: "transport" },
];

/** Looks up real nearby restaurants/attractions/transit via the Places
 * API (New) "Nearby Search" — used to ground the narration's local-area
 * mentions in verified real places instead of letting the model invent
 * business names from parametric memory. Best-effort: any category that
 * fails to fetch is just omitted, never throws. */
export async function findNearbyPlaces(location: { lat: number; lng: number }): Promise<NearbyPlace[]> {
  const results: NearbyPlace[] = [];
  for (const { type, category } of NEARBY_SEARCH_TYPES) {
    try {
      const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": getApiKey(),
          "X-Goog-FieldMask": "places.displayName",
        },
        body: JSON.stringify({
          includedTypes: [type],
          maxResultCount: 3,
          locationRestriction: {
            circle: { center: { latitude: location.lat, longitude: location.lng }, radius: 1000 },
          },
        }),
      });
      if (!res.ok) continue;
      const data = await res.json();
      for (const place of data.places ?? []) {
        if (place.displayName?.text) results.push({ name: place.displayName.text, category });
      }
    } catch {
      // skip this category on any network/parse error
    }
  }
  return results;
}
