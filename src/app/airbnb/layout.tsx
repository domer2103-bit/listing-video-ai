import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Video for Airbnb Hosts",
  description:
    "Turn your Airbnb listing photos into a booking-ready promo video — no camera crew, no editor. Upload photos, chat with the assistant, get a narrated walkthrough in minutes.",
  alternates: { canonical: "/airbnb" },
  openGraph: {
    title: "AI Video for Airbnb Hosts — Online Viewing",
    description:
      "Turn your Airbnb listing photos into a booking-ready promo video — no camera crew, no editor.",
    url: "https://onlineviewing.co.uk/airbnb",
    type: "website",
  },
};

export default function AirbnbLayout({ children }: { children: React.ReactNode }) {
  return children;
}
