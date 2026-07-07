"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 mb-6">
              <AlertTriangle className="h-10 w-10 text-red-500" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Critical Error
            </h1>
            <p className="text-gray-400 mb-8">
              We&apos;re experiencing technical difficulties. Our team has been notified and is working on a fix.
            </p>
            <div className="space-y-4">
              <button
                onClick={reset}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = "/"}
                className="w-full px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Go to Homepage
              </button>
            </div>
            <p className="mt-8 text-sm text-gray-500">
              Error ID: {error.digest}
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
