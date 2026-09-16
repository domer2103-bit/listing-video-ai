import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";
import { PlanId, getPlan } from "./plans";

/** File-based user/billing store, same pattern as store.ts — swap for a
 * real database before this handles concurrent users in production. */

const DATA_DIR = path.join(process.cwd(), "data", "users");

export type SubscriptionStatus =
  | "none"
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete";

export interface UserAccount {
  email: string;
  createdAt: string;
  updatedAt: string;
  /** One-time lifetime free video — separate from the recurring monthly
   * quota paid plans get. */
  freeGenerationUsed: boolean;
  plan: PlanId;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus: SubscriptionStatus;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  videosUsedThisPeriod: number;
  /** Short shareable code for this user's own referral link
   * (onlineviewing.co.uk/r/<code>). Records created before this field
   * existed won't have one until the account API backfills it on next
   * view (see src/app/api/account/route.ts). */
  referralCode?: string;
  /** Email of the user who referred this signup, if any — set once at
   * creation time via the lva_ref cookie, never overwritten afterward. */
  referredBy?: string;
  /** Extra one-time generation credits from referrals, on top of the
   * normal free-lifetime-grant or monthly plan quota. */
  bonusVideoCredits?: number;
  /** Whether this account's own "referred user's first completed video"
   * reward has already fired — prevents re-granting on later videos. */
  referralBonusClaimed?: boolean;
}

function emailKey(email: string): string {
  return email.trim().toLowerCase();
}

async function ensureDataDir() {
  await mkdir(DATA_DIR, { recursive: true });
}

function userPath(email: string): string {
  // Emails contain characters that aren't safe as filenames (@, etc.) —
  // encode rather than sanitize so distinct emails can't collide.
  return path.join(DATA_DIR, `${encodeURIComponent(emailKey(email))}.json`);
}

export async function getUser(email: string): Promise<UserAccount | null> {
  try {
    const raw = await readFile(userPath(email), "utf-8");
    return JSON.parse(raw) as UserAccount;
  } catch {
    return null;
  }
}

export async function saveUser(user: UserAccount): Promise<void> {
  await ensureDataDir();
  user.updatedAt = new Date().toISOString();
  await writeFile(userPath(user.email), JSON.stringify(user, null, 2), "utf-8");
}

/** referredByCode is the visitor's lva_ref cookie value, if any — only
 * consulted when actually creating a brand-new record (never applied to,
 * or overwritten on, an existing user's repeat visit). */
export async function getOrCreateUser(email: string, referredByCode?: string): Promise<UserAccount> {
  const existing = await getUser(email);
  if (existing) return existing;

  let referredBy: string | undefined;
  if (referredByCode) {
    const referrer = await findUserByReferralCode(referredByCode);
    if (referrer && referrer.email !== emailKey(email)) referredBy = referrer.email;
  }

  const now = new Date().toISOString();
  const user: UserAccount = {
    email: emailKey(email),
    createdAt: now,
    updatedAt: now,
    freeGenerationUsed: false,
    plan: "free",
    subscriptionStatus: "none",
    videosUsedThisPeriod: 0,
    referralCode: nanoid(8),
    referredBy,
    bonusVideoCredits: 0,
    referralBonusClaimed: false,
  };
  await saveUser(user);
  return user;
}

async function readAllUsers(): Promise<UserAccount[]> {
  await ensureDataDir();
  const { readdir } = await import("fs/promises");
  const files = await readdir(DATA_DIR);
  const users: UserAccount[] = [];
  for (const f of files) {
    if (!f.endsWith(".json")) continue;
    const raw = await readFile(path.join(DATA_DIR, f), "utf-8");
    users.push(JSON.parse(raw) as UserAccount);
  }
  return users;
}

export async function findUserByStripeCustomerId(customerId: string): Promise<UserAccount | null> {
  const users = await readAllUsers();
  return users.find((u) => u.stripeCustomerId === customerId) ?? null;
}

export async function findUserByReferralCode(code: string): Promise<UserAccount | null> {
  const users = await readAllUsers();
  return users.find((u) => u.referralCode === code) ?? null;
}

/** Number of signups currently attributed to this user. Computed by
 * scanning rather than stored as a counter, so it can't drift out of sync
 * with the actual referredBy records. */
export async function countReferrals(email: string): Promise<number> {
  const users = await readAllUsers();
  const key = emailKey(email);
  return users.filter((u) => u.referredBy === key).length;
}

/** Call when a project reaches "done" — grants the one-time referral bonus
 * (to both the referred user and whoever referred them) the first time this
 * user completes a video, if they were referred and haven't already
 * claimed it. No-ops for organic (non-referred) users, and on every video
 * after the first for referred ones. */
export async function maybeGrantReferralReward(email: string): Promise<void> {
  const user = await getUser(email);
  if (!user || !user.referredBy || user.referralBonusClaimed) return;

  user.bonusVideoCredits = (user.bonusVideoCredits ?? 0) + 1;
  user.referralBonusClaimed = true;
  await saveUser(user);

  const referrer = await getUser(user.referredBy);
  if (referrer) {
    referrer.bonusVideoCredits = (referrer.bonusVideoCredits ?? 0) + 1;
    await saveUser(referrer);
  }
}

export interface QuotaCheck {
  allowed: boolean;
  reason?: string;
}

/** Whether this user can start a new generation right now, given their
 * plan and usage. Free plan gets one lifetime generation; paid plans get
 * a monthly quota that resets on each Stripe billing cycle. Either way, a
 * referral bonus credit (see maybeGrantReferralReward) allows one more
 * generation past the normal limit. */
export function canGenerate(user: UserAccount): QuotaCheck {
  const hasBonus = (user.bonusVideoCredits ?? 0) > 0;

  if (user.plan === "free") {
    if (user.freeGenerationUsed && !hasBonus) {
      return {
        allowed: false,
        reason: "You've used your free generation. [View plans](/pricing) to upgrade and make more videos.",
      };
    }
    return { allowed: true };
  }

  const plan = getPlan(user.plan);
  if (user.subscriptionStatus !== "active" && user.subscriptionStatus !== "trialing") {
    return {
      allowed: false,
      reason: `Your ${plan.name} subscription isn't active. [Check your billing](/account) to reactivate it.`,
    };
  }
  if (user.videosUsedThisPeriod >= plan.videosPerMonth && !hasBonus) {
    return {
      allowed: false,
      reason: `You've used all ${plan.videosPerMonth} videos included in your ${plan.name} plan this month. [View plans](/pricing) to upgrade.`,
    };
  }
  return { allowed: true };
}

/** Call once a generation has actually started (project created), not on
 * every retry — records usage against the free grant, monthly quota, or a
 * referral bonus credit if the normal allowance is already exhausted. */
export async function recordGenerationUsed(email: string): Promise<void> {
  const user = await getOrCreateUser(email);
  const normalAllowanceExhausted =
    user.plan === "free"
      ? user.freeGenerationUsed
      : user.videosUsedThisPeriod >= getPlan(user.plan).videosPerMonth;

  if (normalAllowanceExhausted && (user.bonusVideoCredits ?? 0) > 0) {
    user.bonusVideoCredits = (user.bonusVideoCredits ?? 0) - 1;
  } else if (user.plan === "free") {
    user.freeGenerationUsed = true;
  } else {
    user.videosUsedThisPeriod += 1;
  }
  await saveUser(user);
}
