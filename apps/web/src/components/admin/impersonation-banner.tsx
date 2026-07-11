"use client";

import React, { useEffect, useState } from "react";
import { getImpersonationState, stopImpersonating } from "@/actions/admin";
import { ShieldAlert, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ImpersonationBanner() {
  const [impersonatingUser, setImpersonatingUser] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkState = async () => {
      const res = await getImpersonationState();
      if (res.status === 200) {
        setImpersonatingUser(res.data);
      }
    };
    checkState();
  }, []);

  const handleExit = async () => {
    const res = await stopImpersonating();
    if (res.status === 200) {
      setImpersonatingUser(null);
      router.refresh();
      window.location.href = "/admin/users";
    }
  };

  if (!impersonatingUser) return null;

  return (
    <div className="w-full bg-amber-500 text-black px-4 py-2.5 flex items-center justify-between font-semibold text-xs md:text-sm sticky top-0 z-50 shadow-md">
      <div className="flex items-center gap-x-2">
        <ShieldAlert className="h-4 w-4 text-black animate-pulse" />
        <span>
          Support Impersonation Active: Viewing platform as user{" "}
          <strong className="underline">{impersonatingUser}</strong>.
        </span>
      </div>
      <button
        onClick={handleExit}
        className="flex items-center gap-x-1.5 bg-black text-white px-3 py-1 rounded-md text-xs hover:bg-neutral-800 transition-colors font-bold cursor-pointer"
      >
        <LogOut className="h-3 w-3" />
        Exit Impersonation
      </button>
    </div>
  );
}
