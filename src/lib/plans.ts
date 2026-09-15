export type PlanId = "free" | "starter" | "pro" | "agency";

export interface Plan {
  id: PlanId;
  name: string;
  /** In whole pounds; 0 for the free plan. */
  priceGBP: number;
  /** Recurring monthly video quota. The free plan uses a one-time lifetime
   * grant instead (see freeGenerationLimit in userStore.ts), not this. */
  videosPerMonth: number;
  /** Whether this plan unlocks the paid Veo3+Kling satellite establishing
   * shot. When false, the establishing shot falls back to a free Remotion
   * Ken Burns zoom instead. */
  aiEstablishingShot: boolean;
  /** "curated" = the 6-voice CURATED_VOICES shortlist; "full" reserved for
   * a future larger catalog. */
  voiceAccess: "curated" | "full";
  /** Stripe recurring Price ID for this plan — undefined for the free plan,
   * which has no Stripe object. Read from env so the same code works
   * across test/live Stripe modes. */
  stripePriceId?: string;
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    priceGBP: 0,
    videosPerMonth: 0,
    aiEstablishingShot: false,
    voiceAccess: "curated",
  },
  starter: {
    id: "starter",
    name: "Starter",
    priceGBP: 19,
    videosPerMonth: 5,
    aiEstablishingShot: false,
    voiceAccess: "curated",
    stripePriceId: process.env.STRIPE_PRICE_STARTER,
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceGBP: 49,
    videosPerMonth: 15,
    aiEstablishingShot: true,
    voiceAccess: "curated",
    stripePriceId: process.env.STRIPE_PRICE_PRO,
  },
  agency: {
    id: "agency",
    name: "Agency",
    priceGBP: 149,
    videosPerMonth: 50,
    aiEstablishingShot: true,
    voiceAccess: "curated",
    stripePriceId: process.env.STRIPE_PRICE_AGENCY,
  },
};

export const PAID_PLAN_IDS: PlanId[] = ["starter", "pro", "agency"];

export function getPlan(id: PlanId): Plan {
  return PLANS[id];
}

export function planByStripePriceId(priceId: string): Plan | undefined {
  return Object.values(PLANS).find((p) => p.stripePriceId === priceId);
}
