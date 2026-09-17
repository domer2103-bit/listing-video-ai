declare global {
  interface Window {
    plausible?: (eventName: string, options?: { props?: Record<string, unknown> }) => void;
  }
}

/**
 * Fires a Plausible custom event (see plausible.io/docs/custom-event-goals).
 * The script tag in layout.tsx defines window.plausible unconditionally
 * once it loads — but Plausible's script silently no-ops on localhost by
 * design, to keep dev traffic out of real analytics. That means the call
 * below is safe to always make, but gives no local feedback on its own —
 * so log every call in dev too, regardless of whether plausible() exists,
 * which is the only way to verify events fire with the right data locally.
 */
export function trackEvent(eventName: string, eventData?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;

  window.plausible?.(eventName, eventData ? { props: eventData } : undefined);

  if (process.env.NODE_ENV !== "production") {
    console.log("[analytics]", eventName, eventData ?? {});
  }
}
