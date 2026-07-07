import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Gemai",
  description:
    "Terms of Service for Gemai - AI-Powered Instagram DM Automation Platform",
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <section>{children}</section>;
}
