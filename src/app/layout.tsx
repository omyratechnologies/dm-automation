import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "sonner";
import ReactQueryProvider from "@/providers/react-query-provider";
import ReduxProvider from "@/providers/redux-provider";
import ErrorBoundary from "@/components/global/error-boundary";
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Slate AI - Your AI-Powered Instagram Sales Assistant",
    template: "%s | Slate AI"
  },
  description: "Automate Instagram DMs and comments with intelligent, personalized messages that convert followers into customers—24/7. Start your free trial today.",
  keywords: ["Instagram automation", "AI chatbot", "DM automation", "Instagram marketing", "social media automation", "customer engagement", "Instagram sales"],
  authors: [{ name: "Slate AI Team" }],
  creator: "Slate AI",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://slate-ai.com",
    title: "Slate AI - Your AI-Powered Instagram Sales Assistant",
    description: "Turn Instagram conversations into customers instantly with AI-powered automation.",
    siteName: "Slate AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "Slate AI - Your AI-Powered Instagram Sales Assistant",
    description: "Automate Instagram DMs and comments with intelligent AI responses.",
    creator: "@slateai",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body suppressHydrationWarning className={jakarta.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ErrorBoundary>
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
