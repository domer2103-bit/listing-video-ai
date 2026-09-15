import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Account",
  description: "View your Online Viewing plan, monthly video usage, and manage your subscription billing.",
  alternates: { canonical: "/account" },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
