import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Gemai",
  description:
    "Privacy policy for Gemai - AI-Powered Instagram DM Automation Platform",
};

export default function PrivacyPolicyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <section>{children}</section>;
}
