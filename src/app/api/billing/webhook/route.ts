import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/clients/stripe";
import { planByStripePriceId } from "@/lib/plans";
import { getOrCreateUser, saveUser, findUserByStripeCustomerId } from "@/lib/userStore";

/** Applies a Stripe subscription's current state (plan, status, billing
 * period) onto our user record. Shared by checkout completion and every
 * subscription lifecycle event so they can't drift out of sync. */
async function syncSubscription(subscription: Stripe.Subscription, fallbackEmail?: string) {
  const item = subscription.items.data[0];
  const plan = item ? planByStripePriceId(item.price.id) : undefined;

  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  let user = await findUserByStripeCustomerId(customerId);
  if (!user && fallbackEmail) user = await getOrCreateUser(fallbackEmail);
  if (!user) {
    console.error(`Stripe webhook: no user found for customer ${customerId}`);
    return;
  }

  user.stripeCustomerId = customerId;
  user.stripeSubscriptionId = subscription.id;
  user.subscriptionStatus = subscription.status as typeof user.subscriptionStatus;
  if (plan) user.plan = plan.id;
  if (item) {
    user.currentPeriodStart = new Date(item.current_period_start * 1000).toISOString();
    user.currentPeriodEnd = new Date(item.current_period_end * 1000).toISOString();
  }
  await saveUser(user);
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripe = getStripe();

  let event: Stripe.Event;
  if (webhookSecret && signature) {
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      return NextResponse.json({ error: `Invalid signature: ${err instanceof Error ? err.message : String(err)}` }, { status: 400 });
    }
  } else {
    // Dev convenience only — STRIPE_WEBHOOK_SECRET must be set (via
    // `stripe listen`) before this goes anywhere near production, or
    // anyone can POST fake events here.
    console.warn("STRIPE_WEBHOOK_SECRET not set — accepting webhook body unverified (dev only).");
    event = JSON.parse(body) as Stripe.Event;
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "subscription" && session.subscription) {
        const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await syncSubscription(subscription, session.client_reference_id ?? session.customer_email ?? undefined);
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.created": {
      await syncSubscription(event.data.object as Stripe.Subscription);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
      const user = await findUserByStripeCustomerId(customerId);
      if (user) {
        user.subscriptionStatus = "canceled";
        await saveUser(user);
      }
      break;
    }

    case "invoice.paid": {
      // New billing cycle started (including the first one) — reset usage.
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
      if (customerId) {
        const user = await findUserByStripeCustomerId(customerId);
        if (user) {
          user.videosUsedThisPeriod = 0;
          await saveUser(user);
        }
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
