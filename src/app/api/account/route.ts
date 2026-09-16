import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getUser, saveUser, countReferrals } from "@/lib/userStore";
import { getPlan } from "@/lib/plans";

/** Read-only account/usage lookup by email — no auth, matches the
 * trust-based identity used everywhere else in this app (see
 * useStoredEmail.ts). Doesn't create a user record just from viewing;
 * an email with no record yet is shown as an untouched free plan. A
 * referral code is only backfilled onto an *existing* record (never
 * fabricates a new account just because someone typed an email in here). */
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }

  const user = await getUser(email);
  const plan = getPlan(user?.plan ?? "free");

  let referralCode: string | null = null;
  if (user) {
    referralCode = user.referralCode ?? null;
    if (!referralCode) {
      referralCode = nanoid(8);
      user.referralCode = referralCode;
      await saveUser(user);
    }
  }

  return NextResponse.json({
    email: email.trim().toLowerCase(),
    plan: plan.id,
    planName: plan.name,
    priceGBP: plan.priceGBP,
    videosPerMonth: plan.videosPerMonth,
    videosUsedThisPeriod: user?.videosUsedThisPeriod ?? 0,
    freeGenerationUsed: user?.freeGenerationUsed ?? false,
    subscriptionStatus: user?.subscriptionStatus ?? "none",
    currentPeriodEnd: user?.currentPeriodEnd ?? null,
    hasBilling: Boolean(user?.stripeCustomerId),
    bonusVideoCredits: user?.bonusVideoCredits ?? 0,
    referralCode,
    referralCount: await countReferrals(email),
  });
}
