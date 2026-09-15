"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useStoredEmail } from "@/lib/useStoredEmail";
import { PlanId } from "@/lib/plans";

const TIERS: {
  id: PlanId | "free";
  name: string;
  price: string;
  features: string[];
}[] = [
  {
    id: "free",
    name: "Free",
    price: "£0",
    features: ["1 video, once", "Remotion motion throughout", "Standard voice"],
  },
  {
    id: "starter",
    name: "Starter",
    price: "£19/mo",
    features: ["5 videos/month", "Remotion motion throughout", "Full voice library"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "£49/mo",
    features: ["15 videos/month", "AI satellite establishing shot", "Full voice library", "Priority rendering"],
  },
  {
    id: "agency",
    name: "Agency",
    price: "£149/mo",
    features: ["50 videos/month", "AI satellite establishing shot", "Full voice library", "Batch generation"],
  },
];

export default function Pricing() {
  const { email, setEmail, loaded } = useStoredEmail();
  const [emailInput, setEmailInput] = useState("");
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  const effectiveEmail = email ?? (emailInput.includes("@") ? emailInput.trim() : null);

  // Navigating away is a side effect, not something to do inline in an
  // event handler after an await — route it through an effect instead.
  useEffect(() => {
    if (redirectUrl) window.location.href = redirectUrl;
  }, [redirectUrl]);

  async function subscribe(planId: PlanId) {
    if (!effectiveEmail) return;
    setError(null);
    setLoadingPlan(planId);
    if (!email) setEmail(effectiveEmail);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: effectiveEmail, planId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't start checkout");
      setRedirectUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLoadingPlan(null);
    }
  }

  async function openBillingPortal() {
    if (!email) return;
    setError(null);
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't open billing portal");
      setRedirectUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-16 space-y-10">
      <header className="max-w-xl space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Plans</h1>
        <p className="text-neutral-500">
          One free video to try it out, then pick a plan. Every plan renders the full narrated
          walkthrough — higher tiers add the AI-generated satellite establishing shot and more
          videos per month.
        </p>
      </header>

      {loaded && !email && (
        <div className="max-w-sm space-y-2">
          <label className="block text-sm font-medium text-neutral-900">Your email</label>
          <p className="text-sm text-neutral-500">Required before the Subscribe buttons below will work.</p>
          <input
            type="email"
            placeholder="you@example.com"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>
      )}

      {email && (
        <div className="text-sm text-neutral-500">
          Signed in as <span className="font-medium text-neutral-900">{email}</span> ·{" "}
          <Link href="/account" className="underline underline-offset-2">
            View usage
          </Link>{" "}
          ·{" "}
          <button type="button" onClick={openBillingPortal} className="underline underline-offset-2">
            Manage billing
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {TIERS.map((tier) => (
          <div key={tier.id} className="flex flex-col rounded-xl border border-neutral-200 p-6 space-y-4">
            <div>
              <h2 className="font-semibold text-neutral-900">{tier.name}</h2>
              <p className="text-2xl font-semibold tracking-tight text-neutral-900">{tier.price}</p>
            </div>
            <ul className="flex-1 space-y-2 text-sm text-neutral-600">
              {tier.features.map((f) => (
                <li key={f}>• {f}</li>
              ))}
            </ul>
            {tier.id === "free" ? (
              <Link
                href="/create"
                className="rounded-md border border-neutral-300 px-4 py-2 text-center text-sm font-medium text-neutral-900"
              >
                Start free
              </Link>
            ) : (
              <button
                type="button"
                disabled={!effectiveEmail || loadingPlan !== null}
                onClick={() => subscribe(tier.id as PlanId)}
                className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                {loadingPlan === tier.id ? "Redirecting…" : `Subscribe to ${tier.name}`}
              </button>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-neutral-400">
        By subscribing, you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-2">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-2">
          Privacy Policy
        </Link>
        .
      </p>
    </main>
  );
}
