"use client";
import { onDisconnect } from "@/actions/integrations";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useQueryUser } from "@/hooks/user-queries";
import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { logger } from "@/lib/logger";

type Props = {
  title: string;
  description: string;
  icon: React.ReactNode;
  strategy: "INSTAGRAM" | "CRM";
};

const IntegrationCard = ({ description, icon, strategy, title }: Props) => {
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const queryClient = useQueryClient();

  const { data } = useQueryUser();

  const integrated: {
    name: string;
    id: string;
    instagramId?: string | null;
    expiresAt?: Date | null;
    createdAt?: Date;
  } | undefined = (data?.integrations ?? []).find(
    (integration: any) => integration.name === strategy
  );

  const onConnect = async () => {
    if (strategy === "INSTAGRAM") {
      // Get the Instagram OAuth URL from environment or construct it
      const oauthUrl = process.env.NEXT_PUBLIC_INSTAGRAM_EMBEDDED_OAUTH_URL;
      
      if (oauthUrl) {
        // Use the pre-configured OAuth URL from environment
        window.location.href = oauthUrl;
      } else {
        // Fallback: construct OAuth URL manually if needed
        const instagramAppId = process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID;
        const redirectUri = `${window.location.origin}/callback/instagram`;
        
        if (instagramAppId) {
          const scope = "instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments";
          const constructedUrl = `https://www.instagram.com/oauth/authorize?client_id=${instagramAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code`;
          window.location.href = constructedUrl;
        } else {
          logger.error("Instagram OAuth is not configured");
          alert("Instagram integration is not configured. Please add NEXT_PUBLIC_INSTAGRAM_EMBEDDED_OAUTH_URL or NEXT_PUBLIC_INSTAGRAM_APP_ID to your environment variables.");
        }
      }
    } else {
      logger.info("CRM Auth - Coming soon");
      alert("CRM integration coming soon!");
    }
  };

  const handleDisconnect = async () => {
    if (!integrated?.id) return;
    
    const confirmed = confirm(
      "Are you sure you want to disconnect your Instagram account? This will stop all active automations."
    );
    
    if (!confirmed) return;
    
    setIsDisconnecting(true);
    
    try {
      const result = await onDisconnect(integrated.id);
      
      if (result.status === 200) {
        // Invalidate the user profile query to refresh the UI
        queryClient.invalidateQueries({ queryKey: ["user-profile"] });
        
        // Show success message
        window.location.href = "/dashboard/connections?success=disconnected";
      } else {
        alert(`Failed to disconnect: ${result.error}`);
      }
    } catch (error) {
      logger.error("Error disconnecting integration", { error });
      alert("An error occurred while disconnecting. Please try again.");
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="relative overflow-hidden border border-border rounded-2xl gap-y-4 md:gap-y-0 gap-x-6 p-6 flex flex-col md:flex-row md:items-center justify-between bg-card backdrop-blur-sm hover:border-primary/50 transition-all duration-300 group hover:shadow-xl hover:shadow-primary/10">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="flex items-start md:items-center gap-x-4 flex-1 z-10">
        <div className="p-3 rounded-xl bg-muted border border-border group-hover:scale-110 transition-transform duration-300 shrink-0">
          {icon}
        </div>
        <div className="flex flex-col">
          <h3 className="text-xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">{title}</h3>
          <p className="text-muted-foreground text-sm">{description}</p>
          {integrated && (integrated as any).username && (
            <p className="text-primary text-xs font-bold mt-2.5 flex items-center gap-x-1.5 bg-primary/10 w-fit px-3 py-1 rounded-full border border-primary/20">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              Connected as @{(integrated as any).username}
            </p>
          )}
        </div>
      </div>
      
      <div className="relative z-10 flex flex-row gap-2 w-full md:w-auto justify-end">
        {integrated ? (
          <>
            <Button
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              variant="outline"
              className="rounded-xl text-sm font-semibold px-6 py-2.5 border-destructive/50 text-destructive hover:bg-destructive hover:text-white transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDisconnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                "Disconnect"
              )}
            </Button>
            <Button
              disabled
              className="bg-gradient-brand text-white rounded-xl text-sm font-semibold px-6 py-2.5 opacity-75 cursor-default"
            >
              ✓ Connected
            </Button>
          </>
        ) : (
          <Button
            onClick={onConnect}
            className="bg-gradient-brand text-white rounded-xl text-sm font-semibold px-6 py-2.5 hover:shadow-glow transition-all duration-200 hover:scale-105"
          >
            Connect
          </Button>
        )}
      </div>
    </div>
  );
};

export default IntegrationCard;
