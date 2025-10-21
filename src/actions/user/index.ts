"use server";

import { currentUser } from "@clerk/nextjs/server";

import { redirect } from "next/navigation";
import { createUser, findUser, updateSubscription } from "./queries";
import { refreshToken } from "@/lib/fetch";
import { updateIntegration } from "../integrations/queries";
import { stripe } from "@/lib/stripe";
import {
  getOrSetCache,
  CACHE_TTL,
  cacheKey,
  CACHE_KEYS,
  deleteCache,
  invalidateUserCache,
} from "@/lib/cache";

export const onCurrentUser = async () => {
  const user = await currentUser();
  if (!user) return redirect("/sign-in");

  return user;
};

export const onBoardUser = async () => {
  const user = await onCurrentUser();
  console.log("🔵 onBoardUser called for:", user.id, user.emailAddresses[0].emailAddress);
  try {
    const found = await findUser(user.id);
    console.log("🔍 User found in DB:", !!found);
    if (found) {
      if (found.integrations.length > 0) {
        const today = new Date();
        const time_left =
          found.integrations[0].expiresAt?.getTime()! - today.getTime();

        const days = Math.round(time_left / (1000 * 3600 * 24));
        if (days < 5) {
          console.log("🔄 Token expiring soon, attempting refresh...");

          try {
            const refresh = await refreshToken(found.integrations[0].token);

            if (!refresh || !refresh.access_token) {
              console.error("❌ Token refresh failed: Invalid response from Instagram API");
              // Return user data but flag that token needs attention
              return {
                status: 200,
                data: {
                  firstname: found.firstname,
                  lastname: found.lastname,
                },
                warning: "Instagram connection needs re-authorization",
                requiresReauth: true,
              };
            }

            const today = new Date();
            const expire_date = today.setDate(today.getDate() + 60);

            const update_token = await updateIntegration(
              refresh.access_token,
              new Date(expire_date),
              found.integrations[0].id
            );
            
            if (!update_token) {
              console.error("❌ Failed to update token in database");
              return {
                status: 200,
                data: {
                  firstname: found.firstname,
                  lastname: found.lastname,
                },
                warning: "Failed to save refreshed token",
              };
            }

            console.log("✅ Token refreshed successfully");
          } catch (refreshError) {
            console.error("❌ Token refresh error:", refreshError);
            // Don't fail the entire onboarding, but log the error
            return {
              status: 200,
              data: {
                firstname: found.firstname,
                lastname: found.lastname,
              },
              warning: "Failed to refresh Instagram token",
              error: refreshError instanceof Error ? refreshError.message : "Unknown error",
            };
          }
        }
      }

      return {
        status: 200,
        data: {
          firstname: found.firstname,
          lastname: found.lastname,
        },
      };
    }
    console.log("✨ Creating new user in DB...");
    const created = await createUser(
      user.id,
      user.firstName!,
      user.lastName!,
      user.emailAddresses[0].emailAddress
    );
    console.log("✅ User created successfully:", created);
    return { status: 201, data: created };
  } catch (error) {
    console.log("❌ Error in onBoardUser:", error);
    return { status: 500 };
  }
};

export const onUserInfo = async () => {
  const user = await onCurrentUser();
  const userId = user.id; // Extract to prevent closure capture
  
  try {
    // Use cache with 5-minute TTL
    const profile = await getOrSetCache(
      cacheKey(CACHE_KEYS.USER, userId),
      () => findUser(userId),
      CACHE_TTL.USER_DATA
    );
    
    if (profile) return { status: 200, data: profile };

    return { status: 404 };
  } catch (error) {
    console.error("❌ Error in onUserInfo:", error);
    return { status: 500 };
  }
};

export const onSubscribe = async (session_id: string) => {
  const user = await onCurrentUser();
  const userId = user.id; // Extract to prevent closure capture
  
  try {
    if (!stripe) {
      console.log("❌ Stripe not configured");
      return { status: 503, message: "Payment service not configured" };
    }
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session) {
      const subscribed = await updateSubscription(userId, {
        customerId: session.customer as string,
        plan: "PRO",
      });

      if (subscribed) {
        // Invalidate user cache after subscription update
        await invalidateUserCache(userId);
        return { status: 200 };
      }
      return { status: 401 };
    }
    return { status: 404 };
  } catch (error) {
    return { status: 500 };
  }
};
