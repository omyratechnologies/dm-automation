"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-bg-primary flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 mb-4">
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
          <h1 className="text-4xl font-bold text-slate-text-primary mb-2">
            Oops! Something went wrong
          </h1>
          <p className="text-slate-text-secondary mb-8">
            We encountered an unexpected error. Don&apos;t worry, our team has been notified.
          </p>
          
          {process.env.NODE_ENV === "development" && (
            <details className="mb-6 text-left bg-slate-bg-secondary rounded-lg p-4 border border-slate-text-tertiary/10">
              <summary className="cursor-pointer font-semibold text-slate-text-primary mb-2">
                Error Details (Development Only)
              </summary>
              <pre className="text-xs text-red-400 overflow-auto">
                {error.message}
              </pre>
            </details>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={reset}
            className="bg-gradient-brand text-white hover:shadow-glow"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Link href="/">
            <Button variant="outline" className="w-full sm:w-auto">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </Link>
        </div>

        <div className="mt-8 text-sm text-slate-text-tertiary">
          <p>Need help? Contact us at <a href="mailto:support@gemai.in" className="text-slate-primary hover:underline">support@gemai.in</a></p>
        </div>
      </div>
    </div>
  );
}
