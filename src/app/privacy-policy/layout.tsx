import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | DM.AI",
  description:
    "Privacy policy for DM.AI - Conversational Marketing Automation for Instagram",
};

export default function PrivacyPolicyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <section>{children}</section>;
}
