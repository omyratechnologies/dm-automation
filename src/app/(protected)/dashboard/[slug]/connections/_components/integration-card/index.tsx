"use client";
import { onUserInfo } from "@/actions/user";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import React from "react";

type Props = {
  title: string;
  description: string;
  icon: React.ReactNode;
  strategy: "INSTAGRAM" | "CRM";
};

const IntegrationCard = ({ description, icon, strategy, title }: Props) => {
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
          const constructedUrl = `https://api.instagram.com/oauth/authorize?client_id=${instagramAppId}&redirect_uri=${redirectUri}&scope=user_profile,user_media&response_type=code`;
          window.location.href = constructedUrl;
        } else {
          console.error("Instagram OAuth is not configured");
          alert("Instagram integration is not configured. Please add NEXT_PUBLIC_INSTAGRAM_EMBEDDED_OAUTH_URL or NEXT_PUBLIC_INSTAGRAM_APP_ID to your environment variables.");
        }
      }
    } else {
      console.log("CRM Auth - Coming soon");
      alert("CRM integration coming soon!");
    }
  };

  const { data } = useQuery({
    queryKey: ["user-profile"],
    queryFn: onUserInfo,
  });

  const integrated: { name: string } | undefined = data?.data?.integrations.find(
    (integration: { name: string }) => integration.name === strategy
  );

  return (
    <div className="relative overflow-hidden border border-border rounded-2xl gap-x-6 p-6 flex items-center justify-between bg-card backdrop-blur-sm hover:border-primary/50 transition-all duration-300 group hover:shadow-xl hover:shadow-primary/10">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative z-10 p-3 rounded-xl bg-muted border border-border group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <div className="flex flex-col flex-1 relative z-10">
        <h3 className="text-xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      <Button
        onClick={onConnect}
        disabled={integrated?.name === strategy}
        className="relative z-10 bg-gradient-brand text-white rounded-xl text-sm font-semibold px-6 py-2.5 hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
      >
        {integrated ? "✓ Connected" : "Connect"}
      </Button>
    </div>
  );
};

export default IntegrationCard;
