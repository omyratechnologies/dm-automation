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
  const user = await onCurrentUser();

  try {
    const integration = await getIntegration(user.id);

    if (integration && integration.integrations.length === 0) {
      const token = await generateTokens(code);
      console.log("✅ Token generated:", { 
        user_id: token.user_id, 
        has_token: !!token.access_token 
      });

      if (token && token.access_token) {
        // Get Instagram user ID (if not already in token response)
        let instagramUserId = token.user_id;
        
        if (!instagramUserId) {
          const insta_id = await axios.get(
            `${process.env.INSTAGRAM_BASE_URL}/me?fields=user_id&access_token=${token.access_token}`
          );
          instagramUserId = insta_id.data.user_id;
        }

        console.log("✅ Instagram User ID:", instagramUserId);

        const today = new Date();
        const expire_date = today.setDate(today.getDate() + 60);
        const create = await createIntegration(
          user.id,
          token.access_token,
          new Date(expire_date),
          instagramUserId
        );
        return { status: 200, data: create };
      }
      console.log("🔴 401 - No access token");
      return { status: 401 };
    }
    console.log("🔴 404 - User not found or already has integration");
    return { status: 404 };
  } catch (error) {
    console.log("🔴 500", error);
    return { status: 500, error };
  }
};
