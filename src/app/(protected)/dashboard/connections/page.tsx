"use client";

import { INTEGRATION_CARDS } from "@/constants/integrations";
import React, { useEffect, useState } from "react";
import IntegrationCard from "./_components/integration-card";
import { useSearchParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, XCircle } from "lucide-react";

function Page() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success === "true") {
      setMessage({
        type: "success",
        text: "Instagram account connected successfully! You can now create automations.",
      });
      // Clear message after 5 seconds
      setTimeout(() => setMessage(null), 5000);
    } else if (error) {
      let errorText = "Failed to connect Instagram account. Please try again.";
      
      switch (error) {
        case "already_connected":
          errorText = "You already have an Instagram account connected.";
          break;
        case "no_code":
          errorText = "No authorization code received from Instagram.";
          break;
        case "integration_failed":
          errorText = "Failed to save Instagram connection. Please try again.";
          break;
        case "access_denied":
          errorText = "You denied access to your Instagram account.";
          break;
        case "exception":
          errorText = "An unexpected error occurred. Please try again.";
          break;
      }
      
      setMessage({ type: "error", text: errorText });
      // Clear message after 8 seconds
      setTimeout(() => setMessage(null), 8000);
    }
  }, [searchParams]);

  return (
    <div className="flex justify-center pb-10">
      <div className="flex flex-col w-full lg:w-10/12 xl:w-8/12 gap-y-6">
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-foreground mb-2">Connections</h1>
          <p className="text-muted-foreground">Connect your social media accounts to start automating</p>
        </div>

        {/* Success/Error Messages */}
        {message && (
          <Alert variant={message.type === "success" ? "default" : "destructive"} className="mb-4">
            {message.type === "success" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertTitle>{message.type === "success" ? "Success" : "Error"}</AlertTitle>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {INTEGRATION_CARDS.map((card, key) => (
          <IntegrationCard key={key} {...card} />
        ))}
      </div>
    </div>
  );
}

export default Page;
