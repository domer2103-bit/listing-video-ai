import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Footer } from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const description =
  "Turn any property listing into a cinematic, AI-narrated promo video — paste a listing link or upload photos, no camera crew, no editor.";

export const metadata: Metadata = {
  metadataBase: new URL("https://onlineviewing.co.uk"),
  title: {
    default: "Online Viewing — AI-narrated property videos",
    template: "%s — Online Viewing",
  },
  description,
  alternates: { canonical: "/" },
  openGraph: {
    title: "Online Viewing — AI-narrated property videos",
    description,
    url: "https://onlineviewing.co.uk",
    siteName: "Online Viewing",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Online Viewing — AI-narrated property videos",
    description,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Footer />
        <Script
          defer
          type="module"
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token": "d0836dd004c441dea7ffde8ec0d05d77"}'
          strategy="afterInteractive"
        />
        <Script
          async
          src="https://analytics.onlineviewing.co.uk/js/pa-bQEbFaXeqCTacOW4dPg4b.js"
          strategy="afterInteractive"
        />
        <Script id="plausible-init" strategy="afterInteractive">
          {`window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};
plausible.init()`}
        </Script>
      </body>
    </html>
  );
}
