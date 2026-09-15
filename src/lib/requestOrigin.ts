/**
 * `new URL(request.url).origin` looks like it should give you the public
 * origin a Route Handler was called at, but under `next start` behind a
 * reverse proxy it doesn't — Next.js constructs `request.url` from its own
 * internal bind address, not the incoming Host header, so it silently
 * resolves to "http://localhost:3000" in production even though Traefik is
 * correctly forwarding X-Forwarded-Host/X-Forwarded-Proto. Read those
 * headers directly instead; only fall back to request.url for plain local
 * dev, where there's no proxy in front and it's already correct.
 */
export function resolveRequestOrigin(request: Request): string {
  const proto = request.headers.get("x-forwarded-proto");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (proto && host) return `${proto}://${host}`;
  return new URL(request.url).origin;
}
