import Link from "next/link";

export const metadata = {
  title: "Terms of Service — Online Viewing",
};

export default function TermsOfService() {
  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-16 space-y-8 text-neutral-700">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">Terms of Service</h1>
        <p className="text-sm text-neutral-500">Last updated: 7 September 2026</p>
      </header>

      <section className="space-y-3">
        <p>
          These terms govern your use of Online Viewing (“we”, “us”, “our”), a service operated
          by an individual sole trader based in the United Kingdom, available at
          onlineviewing.co.uk (the “Service”). By using the Service, you agree to these terms. If
          you don’t agree, please don’t use the Service. Questions:{" "}
          <a href="mailto:support@onlineviewing.co.uk" className="text-[#0F9B7A] underline underline-offset-2">
            support@onlineviewing.co.uk
          </a>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-neutral-900">The Service</h2>
        <p>
          Online Viewing turns a property listing (via URL or uploaded photos) into a narrated,
          AI-animated promotional video. You provide the source material (a listing link or
          photos); we scrape, script, narrate, animate, and assemble the output.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-neutral-900">Plans &amp; billing</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>The Free plan includes one video generation, once, at no charge.</li>
          <li>
            Paid plans (Starter, Pro, Agency) are billed monthly in advance via Stripe and
            renew automatically until cancelled.
          </li>
          <li>
            You can cancel anytime from your account’s billing portal; cancellation takes effect
            at the end of your current billing period, and you keep access until then.
          </li>
          <li>
            We don’t offer refunds for partial billing periods, except where required by law.
          </li>
          <li>Prices may change; we’ll give notice before any change affects an active subscription.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-neutral-900">Your content &amp; conduct</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            You’re responsible for the listing URLs and photos you submit — you must have the
            right to use them (e.g. as the listing agent, property owner, or with permission).
          </li>
          <li>Don’t use the Service for content that’s illegal, infringing, or misleading.</li>
          <li>
            Don’t attempt to abuse the free tier (e.g. creating multiple accounts to bypass the
            one-video limit) or interfere with the Service’s operation.
          </li>
          <li>We may suspend or terminate access for violating these terms.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-neutral-900">Ownership</h2>
        <p>
          You own the videos generated from your own listing content. The Service itself, and
          the underlying AI models and software it relies on, remain the property of their
          respective owners.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-neutral-900">No warranty</h2>
        <p>
          The Service is provided “as is.” AI-generated narration and video may contain
          inaccuracies — always review your video before sharing it. We don’t guarantee the
          Service will be uninterrupted or error-free.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-neutral-900">Limitation of liability</h2>
        <p>
          To the extent permitted by law, we aren’t liable for indirect or consequential losses
          arising from your use of the Service. Our total liability for any claim is limited to
          the amount you paid us in the 12 months before the claim arose.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-neutral-900">Changes to these terms</h2>
        <p>
          We may update these terms as the Service evolves. Continued use after a change means
          you accept the updated terms.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-neutral-900">Governing law</h2>
        <p>These terms are governed by the laws of England and Wales.</p>
      </section>

      <p className="text-sm text-neutral-500 pt-4">
        See also our{" "}
        <Link href="/privacy" className="text-[#0F9B7A] underline underline-offset-2">
          Privacy Policy
        </Link>
        .
      </p>
    </main>
  );
}
