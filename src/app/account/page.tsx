"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useStoredEmail } from "@/lib/useStoredEmail";
import { EmailGate } from "@/components/EmailGate";
import { trackEvent } from "@/lib/analytics";

interface AccountInfo {
  email: string;
  plan: string;
  planName: string;
  priceGBP: number;
  videosPerMonth: number;
  videosUsedThisPeriod: number;
  freeGenerationUsed: boolean;
  subscriptionStatus: string;
  currentPeriodEnd: string | null;
  hasBilling: boolean;
  bonusVideoCredits: number;
  referralCode: string | null;
  referralCount: number;
}

export default function Account() {
  const { email, setEmail } = useStoredEmail();
  const [info, setInfo] = useState<AccountInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (redirectUrl) window.location.href = redirectUrl;
  }, [redirectUrl]);

  useEffect(() => {
    if (!email) return;
    fetch(`/api/account?email=${encodeURIComponent(email)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Couldn't load account");
        setInfo(data as AccountInfo);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, [email]);

  async function openBillingPortal() {
    if (!email) return;
    setError(null);
    setPortalLoading(true);
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
      setPortalLoading(false);
    }
  }

  function switchEmail() {
    localStorage.removeItem("lva_email");
    window.dispatchEvent(new Event("lva-email-changed"));
    setInfo(null);
  }

  if (!email) {
    return (
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-16 space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Your account</h1>
          <p className="text-neutral-500">
            No account system here — just type the email you used to generate a video or
            subscribe, and we&apos;ll show its plan and usage.
          </p>
        </header>
        <EmailGate onSubmit={setEmail} />
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-16 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Your account</h1>
        <p className="text-neutral-500">
          {email} ·{" "}
          <button type="button" onClick={switchEmail} className="underline underline-offset-2">
            Not you? Switch email
          </button>
        </p>
      </header>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!info && !error && <p className="text-sm text-neutral-400">Loading…</p>}

      {info && (
        <div className="space-y-6 rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">Current plan</p>
              <p className="text-xl font-semibold text-neutral-900">{info.planName}</p>
            </div>
            {info.plan !== "free" && (
              <p className="text-sm text-neutral-500">
                {info.subscriptionStatus === "active" || info.subscriptionStatus === "trialing"
                  ? "Active"
                  : info.subscriptionStatus === "past_due"
                    ? "Payment past due"
                    : info.subscriptionStatus === "canceled"
                      ? "Canceled"
                      : info.subscriptionStatus}
              </p>
            )}
          </div>

          {info.plan === "free" ? (
            <p className="text-sm text-neutral-600">
              {info.freeGenerationUsed
                ? info.bonusVideoCredits > 0
                  ? `Your free video has been used, but you have ${info.bonusVideoCredits} bonus video${info.bonusVideoCredits === 1 ? "" : "s"} from referrals available.`
                  : "Your free video has been used."
                : "Your free video is available — generate it anytime."}
            </p>
          ) : (
            <div className="space-y-1">
              <p className="text-sm text-neutral-600">
                {info.videosUsedThisPeriod} of {info.videosPerMonth} videos used this month
                {info.bonusVideoCredits > 0 &&
                  ` · +${info.bonusVideoCredits} bonus video${info.bonusVideoCredits === 1 ? "" : "s"} from referrals`}
              </p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                <div
                  className="h-full bg-neutral-900"
                  style={{
                    width: `${Math.min(100, (info.videosUsedThisPeriod / info.videosPerMonth) * 100)}%`,
                  }}
                />
              </div>
              {info.currentPeriodEnd && (
                <p className="text-xs text-neutral-400">
                  Renews {new Date(info.currentPeriodEnd).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/create"
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
            >
              Create a video
            </Link>
            {info.plan === "free" || info.plan === "starter" ? (
              <Link
                href="/pricing"
                className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-900"
              >
                Upgrade
              </Link>
            ) : null}
            {info.hasBilling && (
              <button
                type="button"
                onClick={openBillingPortal}
                disabled={portalLoading}
                className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-900 disabled:opacity-40"
              >
                {portalLoading ? "Opening…" : "Manage billing"}
              </button>
            )}
          </div>
        </div>
      )}

      {info?.referralCode && (
        <div className="space-y-3 rounded-xl border border-neutral-200 p-6">
          <div>
            <h2 className="font-semibold text-neutral-900">Refer a friend</h2>
            <p className="text-sm text-neutral-500">
              Share your link — you both get a bonus video once they finish their first one.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <code className="flex-1 min-w-0 truncate rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
              {typeof window !== "undefined" ? window.location.origin : ""}/r/{info.referralCode}
            </code>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/r/${info.referralCode}`);
                setCopied(true);
                trackEvent("referral_link_copied");
                setTimeout(() => setCopied(false), 2000);
              }}
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-900"
            >
              {copied ? "Copied!" : "Copy link"}
            </button>
          </div>
          <p className="text-sm text-neutral-500">
            {info.referralCount} successful referral{info.referralCount === 1 ? "" : "s"} so far.
          </p>
        </div>
      )}
    </main>
  );
}
