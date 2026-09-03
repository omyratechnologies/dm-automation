import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book a meeting",
  description: "Choose a time for your private Gemai meeting invitation.",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

export default function BookingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
