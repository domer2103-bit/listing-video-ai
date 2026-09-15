import { NextResponse } from "next/server";
import { getStripe } from "@/lib/clients/stripe";
import { getPlan, PlanId, PAID_PLAN_IDS } from "@/lib/plans";
import { getOrCreateUser } from "@/lib/userStore";
import { resolveRequestOrigin } from "@/lib/requestOrigin";

/** Creates a Stripe Checkout session for a paid plan and returns the URL
 * to redirect the browser to. */
export async function POST(request: Request) {
  const { email, planId } = await request.json();

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }
  if (!PAID_PLAN_IDS.includes(planId)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const plan = getPlan(planId as PlanId);
  if (!plan.stripePriceId) {
    return NextResponse.json({ error: `${plan.name} isn't configured for billing yet` }, { status: 500 });
  }

  const user = await getOrCreateUser(email);
  const stripe = getStripe();
  const origin = resolveRequestOrigin(request);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    ...(user.stripeCustomerId ? { customer: user.stripeCustomerId } : { customer_email: user.email }),
    client_reference_id: user.email,
    success_url: `${origin}/create?checkout=success`,
    cancel_url: `${origin}/pricing?checkout=cancelled`,
    metadata: { email: user.email, planId },
  });

  return NextResponse.json({ url: session.url });
}
