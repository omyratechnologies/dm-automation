"use server";

import { redirect } from "next/navigation";
import { onCurrentUser } from "../user";
import { createIntegration, getIntegration } from "./queries";
import { generateTokens } from "@/lib/fetch";
import axios from "axios";

export const onOAuthInstagram = (strategy: "INSTAGRAM" | "CRM") => {
  if (strategy === "INSTAGRAM") {
    return redirect(process.env.INSTAGRAM_EMBEDDED_OAUTH_URL as string);
  } else {
    console.log("CRM Auth");
  }
};

export const onIntegrate = async (code: string) => {
  console.log("🔵 onIntegrate called with code:", code.substring(0, 20) + "...");
  
  try {
    const user = await onCurrentUser();
    console.log("✅ Current user retrieved:", user.id);

    const integration = await getIntegration(user.id);
    console.log("📊 Existing integrations count:", integration?.integrations.length || 0);

    if (integration && integration.integrations.length === 0) {
      console.log("🔄 No existing integration, proceeding with token generation...");
      
      try {
        const token = await generateTokens(code);
        console.log("✅ Token generated:", { 
          user_id: token.user_id, 
          has_token: !!token.access_token,
          token_type: token.token_type 
        });

        if (token && token.access_token) {
          // Get Instagram user ID (if not already in token response)
          let instagramUserId = token.user_id;
          
          if (!instagramUserId) {
            console.log("🔄 Fetching Instagram user ID from API...");
            const insta_id = await axios.get(
              `${process.env.INSTAGRAM_BASE_URL}/me?fields=user_id&access_token=${token.access_token}`
            );
            instagramUserId = insta_id.data.user_id;
          }

          console.log("✅ Instagram User ID:", instagramUserId);

          const today = new Date();
          const expire_date = today.setDate(today.getDate() + 60);
          
          console.log("💾 Creating integration in database...");
          const create = await createIntegration(
            user.id,
            token.access_token,
            new Date(expire_date),
            instagramUserId
          );
          
          console.log("✅ Integration created successfully:", create);
          return { status: 200, data: create };
        }
        
        console.error("🔴 401 - No access token in response");
        return { status: 401, error: "No access token received" };
        
      } catch (tokenError: any) {
        console.error("🔴 Token generation failed:", {
          message: tokenError.message,
          response: tokenError.response?.data,
          status: tokenError.response?.status,
        });
        return { 
          status: 500, 
          error: "Token generation failed: " + tokenError.message 
        };
      }
    }
    
    console.log("🔴 404 - User not found or already has integration");
    return { 
      status: 404, 
      error: integration?.integrations.length 
        ? "User already has an Instagram integration" 
        : "User not found" 
    };
    
  } catch (error: any) {
    console.error("🔴 500 - Unexpected error in onIntegrate:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return { 
      status: 500, 
      error: error.message || "Unknown error occurred" 
    };
  }
};
