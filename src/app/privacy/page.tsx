import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Online Viewing",
};

export default function PrivacyPolicy() {
  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-16 space-y-8 text-neutral-700">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">Privacy Policy</h1>
        <p className="text-sm text-neutral-500">Last updated: 7 September 2026</p>
      </header>

      <section className="space-y-3">
        <p>
          Online Viewing (“we”, “us”, “our”) is a trading name operated by an individual sole
          trader based in the United Kingdom. This policy explains what personal data we
          collect through onlineviewing.co.uk (the “Service”), why, and what rights you have
          over it. For any questions or requests, contact{" "}
          <a href="mailto:support@onlineviewing.co.uk" className="text-[#0F9B7A] underline underline-offset-2">
            support@onlineviewing.co.uk
          </a>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-neutral-900">What we collect</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Email address</strong> — required to use the Service, so we can track your
            free video allowance and (if you subscribe) your plan and usage. Stored on our
            servers against your account record, and remembered in your browser’s local storage
            so you don’t have to re-enter it on return visits.
          </li>
          <li>
            <strong>Listing data</strong> — if you paste a property listing URL, we scrape the
            publicly available listing information (address, price, photos, floorplan, agent
            details) to build your video.
          </li>
          <li>
            <strong>Uploaded photos</strong> — if you use the photo-upload flow instead of a
            listing URL, the images you upload are stored on our servers to generate your video.
          </li>
          <li>
            <strong>Chat messages</strong> — conversations with the in-app assistant are stored
            for the duration needed to build your video.
          </li>
          <li>
            <strong>Billing information</strong> — if you subscribe to a paid plan, payment is
            handled entirely by Stripe. We never see or store your card details — we only
            receive your subscription status, plan, and Stripe customer/subscription IDs.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-neutral-900">Third parties we use</h2>
        <p>To provide the Service, the data above is processed by:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Stripe</strong> — payment processing and subscription billing.</li>
          <li><strong>Anthropic</strong> — powers the in-app chat assistant and script writing.</li>
          <li><strong>Inworld AI</strong> — generates the spoken narration audio.</li>
          <li><strong>kie.ai</strong> and its underlying AI model providers — generate AI video clips from listing photos.</li>
          <li><strong>Google</strong> — satellite imagery (Maps) used for establishing shots.</li>
          <li><strong>Amazon Web Services</strong> — cloud video rendering infrastructure.</li>
          <li><strong>Hostinger</strong> — hosts the Service.</li>
        </ul>
        <p>
          Each of these providers processes data only as needed to perform their function and is
          bound by their own privacy terms.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-neutral-900">Cookies &amp; local storage</h2>
        <p>
          We don’t use advertising or analytics cookies. We use your browser’s local storage —
          functionally similar to a cookie — to remember your email address between visits, so
          the Service knows who you are without asking again. This is strictly necessary for the
          Service to work and isn’t used for tracking or advertising.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-neutral-900">How long we keep data</h2>
        <p>
          We retain your account and generated content for as long as you have an active free
          allowance or subscription, and afterward for a reasonable period in case you return.
          You can request deletion at any time — see “Your rights” below.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-neutral-900">Your rights</h2>
        <p>Under UK data protection law, you have the right to:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Access the personal data we hold about you</li>
          <li>Have inaccurate data corrected</li>
          <li>Request erasure of your data</li>
          <li>Object to or restrict how we process your data</li>
          <li>Receive your data in a portable format</li>
          <li>Complain to the UK Information Commissioner’s Office (ICO) at ico.org.uk</li>
        </ul>
        <p>
          To exercise any of these rights, email{" "}
          <a href="mailto:support@onlineviewing.co.uk" className="text-[#0F9B7A] underline underline-offset-2">
            support@onlineviewing.co.uk
          </a>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-neutral-900">Changes to this policy</h2>
        <p>
          We may update this policy as the Service evolves. Material changes will be reflected
          by updating the date at the top of this page.
        </p>
      </section>

      <p className="text-sm text-neutral-500 pt-4">
        See also our{" "}
        <Link href="/terms" className="text-[#0F9B7A] underline underline-offset-2">
          Terms of Service
        </Link>
        .
      </p>
    </main>
  );
}
