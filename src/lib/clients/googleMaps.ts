/**
 * Google Maps Platform — Static Maps (satellite) + Street View Static images
 * for the establishing-shot intro (high-altitude zoom → street level).
 *
 * Needs GOOGLE_MAPS_API_KEY with the "Maps Static API" and "Street View
 * Static API" enabled and billing set up on the Google Cloud project. The
 * key is passed as a query param on the image URL — that URL then gets
 * handed to kie.ai to fetch server-side, so the key is visible to kie.ai's
 * infrastructure. Fine for a personal/internal tool; for anything more
 * exposed, restrict the key by server IP (not HTTP referrer, which doesn't
 * apply to server-to-server fetches) and set a usage quota.
 *
 * Establishing shots are skipped entirely (see scenePlan.ts) when this key
 * isn't set — no hard dependency.
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
  const params = new URLSearchParams({
    center: `${location.lat},${location.lng}`,
    zoom: "19",
    size: "1024x1024",
    maptype: "satellite",
    key: getApiKey(),
  });
  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
}

/** Ground-level Street View image at the property's coordinates. */
export function buildStreetViewImageUrl(location: { lat: number; lng: number }): string {
  const params = new URLSearchParams({
    location: `${location.lat},${location.lng}`,
    size: "1024x1024",
    fov: "80",
    source: "outdoor",
    key: getApiKey(),
  });
  return `https://maps.googleapis.com/maps/api/streetview?${params.toString()}`;
}
