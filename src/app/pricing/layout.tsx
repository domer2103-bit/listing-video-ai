import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Compare Online Viewing's plans — a free trial video, then Starter (£19/mo), Pro (£49/mo) with an AI satellite establishing shot, or Agency (£149/mo) for batch generation.",
  alternates: { canonical: "/pricing" },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
