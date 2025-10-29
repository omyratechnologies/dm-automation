import axios from "axios";
import { retryInstagramApi } from "./retry";
import { checkRateLimit, instagramApiRateLimiter } from "./redis";

/* 

1. Short Lived Access Token
  - Initial Token received from Instagram after authentication
  - Obtained through the OAuthflow in the `generateTokens` function
  - Validity: 1 hour
  - Exchanged for Long Lived Token

2. Long Lived Access Token
  - Validity: 60 days
  - Used to make requests to the Instagram API
  - Used for making API calls over an extended period without requiring the user to re-authenticate.


3. Refresh Access Token
  - Used to refresh the long-lived access token
  - Validity: Called Periodically
  - Used to maintain access to the Instagram API

*/

//Refresh Instagram access token to maintain access
export const refreshToken = async (token: string) => {
  const refresh_token = await axios.get(
    `${process.env.INSTAGRAM_BASE_URL}/refresh_access_token?grant_type=ig_refresh_token&access_token=${token}`
  );

  return refresh_token.data;
};

//Sending Direct Messages
export const sendDM = async (
  userId: string,
  recieverId: string,
  prompt: string,
  token: string
) => {
  console.log("📤 Sending DM...");
  
  // Check rate limit before making the API call
  const rateLimitCheck = await checkRateLimit(
    instagramApiRateLimiter,
    `instagram:dm:${userId}`
  );
  
  if (!rateLimitCheck.success) {
    console.error(
      `🚫 Instagram API rate limit exceeded. Resets at ${rateLimitCheck.reset}`
    );
    throw new Error(
      `Rate limit exceeded. Please try again at ${rateLimitCheck.reset.toLocaleTimeString()}`
    );
  }
  
  // Use retry logic for the API call
  return await retryInstagramApi(
    async () => {
      return await axios.post(
        `${process.env.INSTAGRAM_BASE_URL}/v21.0/${userId}/messages`,
        {
          recipient: {
            id: recieverId,
          },
          message: {
            text: prompt,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
    },
    "Send DM"
  );
};

//Sending Private replies to comments
export const sendPrivateMessage = async (
  userId: string,
  recieverId: string,
  prompt: string,
  token: string
) => {
  console.log("📤 Sending private message to comment...");
  
  // Check rate limit before making the API call
  const rateLimitCheck = await checkRateLimit(
    instagramApiRateLimiter,
    `instagram:comment:${userId}`
  );
  
  if (!rateLimitCheck.success) {
    console.error(
      `🚫 Instagram API rate limit exceeded. Resets at ${rateLimitCheck.reset}`
    );
    throw new Error(
      `Rate limit exceeded. Please try again at ${rateLimitCheck.reset.toLocaleTimeString()}`
    );
  }
  
  // Use retry logic for the API call
  return await retryInstagramApi(
    async () => {
      return await axios.post(
        `${process.env.INSTAGRAM_BASE_URL}/${userId}/messages`,
        {
          recipient: {
            comment_id: recieverId,
          },
          message: {
            text: prompt,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
    },
    "Send Private Message"
  );
};

//exchange a short-lived access token for a long-lived one during the authentication process
export const generateTokens = async (code: string) => {
  // Step 1: Exchange authorization code for short-lived access token
  // Reference: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login#step-2--exchange-the-code-for-a-token
  
  const tokenForm = new FormData();
  tokenForm.append("client_id", process.env.INSTAGRAM_CLIENT_ID as string);
  tokenForm.append("client_secret", process.env.INSTAGRAM_CLIENT_SECRET as string);
  tokenForm.append("grant_type", "authorization_code");
  tokenForm.append("redirect_uri", `${process.env.NEXT_PUBLIC_HOST_URL}/callback/instagram`);
  tokenForm.append("code", code);

  const shortTokenRes = await fetch(process.env.INSTAGRAM_TOKEN_URL as string, {
    method: "POST",
    body: tokenForm,
  });

  const tokenData = await shortTokenRes.json();
  
  console.log("📥 Token exchange response:", tokenData);
  
  // Check for errors
  if (tokenData.error_type || tokenData.error) {
    console.error("❌ Token exchange failed:", tokenData);
    throw new Error(tokenData.error_message || tokenData.error?.message || "Failed to exchange token");
  }
  
  // Instagram Business Login returns data in different format
  const shortToken = tokenData.data ? tokenData.data[0] : tokenData;
  
  if (!shortToken.access_token) {
    console.error("❌ No access token in response:", tokenData);
    throw new Error("No access token received");
  }
  
  console.log("✅ Got short-lived token, user_id:", shortToken.user_id);
  console.log("✅ Permissions granted:", shortToken.permissions);
  
  // Step 2: Exchange short-lived token for long-lived token (60 days)
  // Reference: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login#step-3--get-a-long-lived-access-token
  
  try {
    const longTokenUrl = `${process.env.INSTAGRAM_BASE_URL}/access_token?grant_type=ig_exchange_token&client_secret=${process.env.INSTAGRAM_CLIENT_SECRET}&access_token=${shortToken.access_token}`;
    
    const longTokenRes = await axios.get(longTokenUrl);
    
    console.log("✅ Long-lived token acquired, expires in:", longTokenRes.data.expires_in, "seconds");
    
    return {
      access_token: longTokenRes.data.access_token,
      token_type: longTokenRes.data.token_type,
      expires_in: longTokenRes.data.expires_in,
      user_id: shortToken.user_id,
      permissions: shortToken.permissions
    };
  } catch (error) {
    console.error("❌ Failed to get long-lived token:", error);
    // Return short-lived token as fallback
    return shortToken;
  }
};
