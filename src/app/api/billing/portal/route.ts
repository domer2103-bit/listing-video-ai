import { NextResponse } from "next/server";
import { getStripe } from "@/lib/clients/stripe";
import { getUser } from "@/lib/userStore";
import { resolveRequestOrigin } from "@/lib/requestOrigin";

/** Creates a Stripe billing portal session so a subscriber can update
 * payment details, change plan, or cancel. */
export async function POST(request: Request) {
  const { email } = await request.json();
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }

  const user = await getUser(email);
  if (!user?.stripeCustomerId) {
    return NextResponse.json({ error: "No billing account found for this email" }, { status: 404 });
  }

  const stripe = getStripe();
  const origin = resolveRequestOrigin(request);

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${origin}/create`,
  });

  return NextResponse.json({ url: session.url });
}
