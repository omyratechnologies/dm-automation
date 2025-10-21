"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, X } from "lucide-react";

interface LegalPageHeaderProps {
  backHref?: string;
  closeHref?: string;
}

export default function LegalPageHeader({ 
  backHref = "/", 
  closeHref = "/" 
}: LegalPageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <Link href={backHref}>
        <Button variant="ghost" size="sm" className="gap-2 hover:bg-accent">
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to Home</span>
          <span className="sm:hidden">Back</span>
        </Button>
      </Link>
      <Link href={closeHref}>
        <Button 
          variant="ghost" 
          size="icon"
          className="hover:bg-accent"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </Button>
      </Link>
    </div>
  );
}
