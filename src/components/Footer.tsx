import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-neutral-200 px-6 py-6 text-sm text-neutral-500">
      <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-2">
          <Image src="/brand/wordmark-light.png" alt="Online Viewing" width={98} height={24} />
          <span>&copy; {new Date().getFullYear()}</span>
        </span>
        <div className="flex gap-4">
          <Link href="/for-sellers" className="hover:text-neutral-900">
            For Sellers
          </Link>
          <Link href="/for-airbnb-hosts" className="hover:text-neutral-900">
            For Airbnb Hosts
          </Link>
          <Link href="/blog" className="hover:text-neutral-900">
            Blog
          </Link>
          <Link href="/tools/video-ready-checklist" className="hover:text-neutral-900">
            Photo Checklist
          </Link>
          <Link href="/compare" className="hover:text-neutral-900">
            Compare
          </Link>
          <Link href="/privacy" className="hover:text-neutral-900">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-neutral-900">
            Terms of Service
          </Link>
          <a href="mailto:support@onlineviewing.co.uk" className="hover:text-neutral-900">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
