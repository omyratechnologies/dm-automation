"use client";

import { Button } from "@/components/ui/button";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-bg-primary flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-primary/10 mb-4">
            <FileQuestion className="h-10 w-10 text-slate-primary" />
          </div>
          <h1 className="text-6xl font-bold text-slate-text-primary mb-2">
            404
          </h1>
          <h2 className="text-2xl font-semibold text-slate-text-primary mb-4">
            Page Not Found
          </h2>
          <p className="text-slate-text-secondary mb-8">
            Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved or deleted.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button className="bg-gradient-brand text-white hover:shadow-glow w-full sm:w-auto">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </Link>
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-text-tertiary/10">
          <p className="text-sm text-slate-text-tertiary mb-4">
            Looking for something specific?
          </p>
          <div className="flex flex-wrap gap-2 justify-center text-sm">
            <Link href="/" className="text-slate-primary hover:underline">
              Home
            </Link>
            <span className="text-slate-text-tertiary">•</span>
            <Link href="/contact" className="text-slate-primary hover:underline">
              Contact
            </Link>
            <span className="text-slate-text-tertiary">•</span>
            <Link href="/sign-in" className="text-slate-primary hover:underline">
              Sign In
            </Link>
            <span className="text-slate-text-tertiary">•</span>
            <Link href="/privacy-policy" className="text-slate-primary hover:underline">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
