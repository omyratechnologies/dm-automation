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

  const integrated:
    | {
        name: string;
        id: string;
        instagramId?: string | null;
        expiresAt?: Date | null;
        createdAt?: Date;
      }
    | undefined = (data?.integrations ?? []).find(
    (integration: any) => integration.name === strategy
  );

  const onConnect = async () => {
    if (strategy === "INSTAGRAM") {
      const oauthUrl = process.env.NEXT_PUBLIC_INSTAGRAM_EMBEDDED_OAUTH_URL;

      if (oauthUrl) {
        window.location.href = oauthUrl;
      } else {
        const instagramAppId = process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID;
        const redirectUri = `${window.location.origin}/callback/instagram`;

        if (instagramAppId) {
          const scope =
            "instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments";
          const constructedUrl = `https://www.instagram.com/oauth/authorize?client_id=${instagramAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code`;
          window.location.href = constructedUrl;
        } else {
          logger.error("Instagram OAuth is not configured");
          alert(
            "Instagram integration is not configured. Please add NEXT_PUBLIC_INSTAGRAM_EMBEDDED_OAUTH_URL or NEXT_PUBLIC_INSTAGRAM_APP_ID to your environment variables."
          );
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
        queryClient.invalidateQueries({ queryKey: ["user-profile"] });
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
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-border bg-card p-5 transition-colors duration-quiet hover:border-hairline-strong">
      <div className="flex items-start md:items-center gap-x-4 flex-1 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted border border-border">
          {icon}
        </div>
        <div className="flex flex-col min-w-0">
          <h3 className="text-base font-semibold text-foreground mb-0.5">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">{description}</p>
          {integrated && (integrated as any).username && (
            <p className="mt-2 inline-flex items-center gap-x-1.5 w-fit rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Connected as @{(integrated as any).username}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-row gap-2 w-full md:w-auto justify-end shrink-0">
        {integrated ? (
          <>
            <Button
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
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
            <Button size="sm" disabled variant="secondary">
              Connected
            </Button>
          </>
        ) : (
          <Button onClick={onConnect} size="sm">
            Connect
          </Button>
        )}
      </div>
    </div>
  );
};

export default IntegrationCard;
