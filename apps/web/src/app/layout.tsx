import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "sonner";
import ReactQueryProvider from "@/providers/react-query-provider";
import ReduxProvider from "@/providers/redux-provider";
import ErrorBoundary from "@/components/global/error-boundary";
import ImpersonationBanner from "@/components/admin/impersonation-banner";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Gemai - AI-Powered Instagram DM Automation & Sales Assistant",
    template: "%s | Gemai"
  },
  description: "Transform Instagram DMs into revenue with Gemai's intelligent AI automation. Automate customer conversations, qualify leads, and boost sales 24/7. Free plan available—start today!",
  keywords: [
    "Instagram automation",
    "AI chatbot",
    "DM automation",
    "Instagram marketing",
    "social media automation",
    "customer engagement",
    "Instagram sales",
    "lead generation",
    "Instagram business tools",
    "automated responses",
    "Instagram AI assistant",
    "Gemai",
    "Instagram DM bot",
    "comment automation",
    "Instagram growth"
  ],
  authors: [{ name: "Gemai Team" }],
  creator: "Gemai by Omyra Technologies",
  publisher: "Omyra Technologies",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://gemai.in",
    title: "Gemai - AI-Powered Instagram DM Automation & Sales Assistant",
    description: "Transform Instagram conversations into customers instantly with Gemai's intelligent AI automation. Engage, qualify, and convert—24/7.",
    siteName: "Gemai",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gemai - AI-Powered Instagram DM Automation",
    description: "Automate Instagram DMs and comments with intelligent AI. Turn followers into customers 24/7.",
    creator: "@gemaiapp",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: "https://gemai.in",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Provide a fallback key for build time (will be overridden in production)
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_placeholder';
  
  return (
    <ClerkProvider
      appearance={{
        baseTheme: undefined,
      }}
      publishableKey={clerkPublishableKey}
    >
      <html lang="en" suppressHydrationWarning>
        <body suppressHydrationWarning className={jakarta.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ErrorBoundary>
              <ImpersonationBanner />
              <ReduxProvider>
                <ReactQueryProvider>{children}</ReactQueryProvider>
              </ReduxProvider>
            </ErrorBoundary>

            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
