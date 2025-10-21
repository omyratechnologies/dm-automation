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
  const insta_form = new FormData();
  insta_form.append("client_id", process.env.INSTAGRAM_CLIENT_ID as string);

  insta_form.append(
    "client_secret",
    process.env.INSTAGRAM_CLIENT_SECRET as string
  );
  insta_form.append("grant_type", "authorization_code");
  insta_form.append(
    "redirect_uri",
    `${process.env.NEXT_PUBLIC_HOST_URL}/callback/instagram`
  );
  insta_form.append("code", code);

  const shortTokenRes = await fetch(process.env.INSTAGRAM_TOKEN_URL as string, {
    method: "POST",
    body: insta_form,
  });

  const token = await shortTokenRes.json();
  if (token.permissions.length > 0) {
    console.log(token, "got permissions");
    const long_token = await axios.get(
      `${process.env.INSTAGRAM_BASE_URL}/access_token?grant_type=ig_exchange_token&client_secret=${process.env.INSTAGRAM_CLIENT_SECRET}&access_token=${token.access_token}`
    );

    return long_token.data;
  }
};
