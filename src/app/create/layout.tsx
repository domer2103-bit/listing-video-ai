import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Your Property Video",
  description:
    "Chat with the AI assistant to turn a listing link or uploaded photos into a fully narrated, AI-animated property video — no forms, no editing software.",
  alternates: { canonical: "/create" },
};

export default function CreateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
