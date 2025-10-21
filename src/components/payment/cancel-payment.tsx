"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const CancelPayment = () => {
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.push("/dashboard");
    }, 3000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="flex flex-col justify-center items-center h-screen w-full">
      <h4 className="text-5xl font-bold">404</h4>
      <p className="text-xl font-bold">
        Oops! You canceled the payment. Come back if you change your mind.
      </p>
      <p className="text-sm mt-4 text-muted-foreground">
        Redirecting to dashboard in 3 seconds...
      </p>
    </div>
  );
};
