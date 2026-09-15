import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
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

export async function getOrCreateUser(email: string): Promise<UserAccount> {
  const existing = await getUser(email);
  if (existing) return existing;

  const now = new Date().toISOString();
  const user: UserAccount = {
    email: emailKey(email),
    createdAt: now,
    updatedAt: now,
    freeGenerationUsed: false,
    plan: "free",
    subscriptionStatus: "none",
    videosUsedThisPeriod: 0,
  };
  await saveUser(user);
  return user;
}

export async function findUserByStripeCustomerId(customerId: string): Promise<UserAccount | null> {
  await ensureDataDir();
  const { readdir } = await import("fs/promises");
  const files = await readdir(DATA_DIR);
  for (const f of files) {
    if (!f.endsWith(".json")) continue;
    const raw = await readFile(path.join(DATA_DIR, f), "utf-8");
    const user = JSON.parse(raw) as UserAccount;
    if (user.stripeCustomerId === customerId) return user;
  }
  return null;
}

export interface QuotaCheck {
  allowed: boolean;
  reason?: string;
}

/** Whether this user can start a new generation right now, given their
 * plan and usage. Free plan gets one lifetime generation; paid plans get
 * a monthly quota that resets on each Stripe billing cycle. */
export function canGenerate(user: UserAccount): QuotaCheck {
  if (user.plan === "free") {
    if (user.freeGenerationUsed) {
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
  if (user.videosUsedThisPeriod >= plan.videosPerMonth) {
    return {
      allowed: false,
      reason: `You've used all ${plan.videosPerMonth} videos included in your ${plan.name} plan this month. [View plans](/pricing) to upgrade.`,
    };
  }
  return { allowed: true };
}

/** Call once a generation has actually started (project created), not on
 * every retry — records usage against the free grant or monthly quota. */
export async function recordGenerationUsed(email: string): Promise<void> {
  const user = await getOrCreateUser(email);
  if (user.plan === "free") {
    user.freeGenerationUsed = true;
  } else {
    user.videosUsedThisPeriod += 1;
  }
  await saveUser(user);
}
