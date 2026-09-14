import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-neutral-200 px-6 py-6 text-sm text-neutral-500">
      <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <span>&copy; {new Date().getFullYear()} Online Viewing</span>
        <div className="flex gap-4">
          <Link href="/blog" className="hover:text-neutral-900">
            Blog
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
