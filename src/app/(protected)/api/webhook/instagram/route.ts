import { findAutomation } from "@/actions/automations/queries";
import {
  createChatHistory,
  getChatHistory,
  getKeywordAutomation,
  getKeywordPost,
  matchKeyword,
  trackResponses,
} from "@/actions/webhook/queries";
import { sendDM, sendPrivateMessage } from "@/lib/fetch";
import { openai } from "@/lib/openai";
import { client } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { checkRateLimit, webhookRateLimiter, openaiRateLimiter } from "@/lib/redis";
import { retryOpenAI } from "@/lib/retry";
import { validateAutomationAccess, logSubscriptionViolation } from "@/lib/subscription";
import {
  enforceDMCooldown,
  enforceCommentCooldown,
  enforceSmartAICooldown,
  checkAutomationCooldown,
  setAutomationCooldown,
} from "@/lib/cooldown";

//Handles Initial Verification of webhook endpoint
export async function GET(req: NextRequest) {
  const hub = req.nextUrl.searchParams.get("hub.challenge");
  const verifyToken = req.nextUrl.searchParams.get("hub.verify_token");
  
  // Verify the token matches our expected value
  if (verifyToken === process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(hub);
  }
  
  return new NextResponse("Forbidden", { status: 403 });
}

//Handles the incoming webhook payload
export async function POST(req: NextRequest) {
  try {
    // Rate limiting check for webhook endpoint
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const rateLimitCheck = await checkRateLimit(webhookRateLimiter, `webhook:${ip}`);
    
    if (!rateLimitCheck.success) {
      console.warn(`🚫 Webhook rate limit exceeded for IP: ${ip}`);
      return NextResponse.json(
        { 
          error: "Rate limit exceeded",
          resetAt: rateLimitCheck.reset.toISOString()
        },
        { status: 429 }
      );
    }
    
    // Get the raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get("x-hub-signature-256");
    
    // Verify webhook signature
    if (!signature || !process.env.INSTAGRAM_APP_SECRET) {
      console.error("❌ Missing signature or app secret");
      return NextResponse.json(
        { error: "Webhook verification failed" },
        { status: 403 }
      );
    }
    
    // Calculate expected signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.INSTAGRAM_APP_SECRET)
      .update(rawBody)
      .digest("hex");
    
    // Compare signatures (constant-time comparison to prevent timing attacks)
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature.replace("sha256=", "")),
      Buffer.from(expectedSignature)
    );
    
    if (!isValid) {
      console.error("❌ Invalid webhook signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 403 }
      );
    }
    
    console.log("✅ Webhook signature verified");
    
    // Parse the verified payload
    const webhook_payload = JSON.parse(rawBody);
    let matcher;
    
    //Checks if the payload is a message or a comment
    if (webhook_payload.entry[0].messaging) {
      //DM
      matcher = await matchKeyword(
        webhook_payload.entry[0].messaging[0].message.text
      );
    }

    if (webhook_payload.entry[0].changes) {
      //Comment
      matcher = await matchKeyword(
        webhook_payload.entry[0].changes[0].value.text
      );
    }

    //Match found
    if (matcher && matcher.automationId) {
      console.log("Matched");

      //If the payload is a message
      if (webhook_payload.entry[0].messaging) {
        //Get automation details
        const automation = await getKeywordAutomation(
          matcher.automationId,
          true
        );

        if (automation && automation.trigger) {
          // Validate subscription before processing
          const subscriptionValidation = validateAutomationAccess(
            automation.User?.subscription?.plan,
            automation.listener?.listener,
            automation.listener?.dmCount || 0,
            automation.listener?.commentCount || 0,
            false // This is a DM
          );
          
          if (!subscriptionValidation.isValid) {
            logSubscriptionViolation(
              subscriptionValidation,
              automation.User?.clerkId || "unknown",
              "Instagram DM Automation"
            );
            
            // Send a notification to user about upgrade (optional)
            // For now, we just log and return success to Instagram
            return NextResponse.json(
              {
                message: "Subscription limit reached",
                plan: subscriptionValidation.plan,
              },
              { status: 200 }
            );
          }
          
          // Check global automation cooldown
          const automationCooldown = await checkAutomationCooldown(automation.id);
          if (!automationCooldown.allowed) {
            console.log(
              `⏱️ Automation cooldown active. ${automationCooldown.remainingTime}s remaining`
            );
            return NextResponse.json(
              { message: "Automation in cooldown" },
              { status: 200 }
            );
          }
          
          //If a listener is set to send a predefined message, use the sendDM function to send message to insta users - The `sendDM` function uses the Instagram Graph API endpoint:`https://graph.facebook.com/v21.0/{user-id}/messages`
          if (
            automation.listener &&
            automation.listener.listener === "MESSAGE"
          ) {
            // Check DM cooldown
            const cooldown = await enforceDMCooldown(
              automation.id,
              webhook_payload.entry[0].id,
              webhook_payload.entry[0].messaging[0].sender.id
            );
            
            if (!cooldown.allowed) {
              console.log(
                `⏱️ DM cooldown active for user. ${cooldown.remainingTime}s remaining`
              );
              return NextResponse.json(
                { message: "DM cooldown active" },
                { status: 200 }
              );
            }
            
            const direct_message = await sendDM(
              webhook_payload.entry[0].id,
              webhook_payload.entry[0].messaging[0].sender.id,
              automation.listener?.prompt,
              automation.User?.integrations[0].token!
            );

            if (direct_message.status === 200) {
              const tracked = await trackResponses(automation.id, "DM");
              // Set global automation cooldown
              await setAutomationCooldown(automation.id);
              
              if (tracked) {
                return NextResponse.json(
                  {
                    message: "Message sent",
                  },
                  { status: 200 }
                );
              }
            }
          }

          //PREMIUM USER : If a listener is set to use the SMARTAI model, use the OpenAI API to generate a response and sends the message to the user using the same sendDM function.
          if (
            automation.listener &&
            automation.listener.listener === "SMARTAI" &&
            automation.User?.subscription?.plan === "PRO"
          ) {
            // Check SMARTAI cooldown
            const conversationId = `${webhook_payload.entry[0].id}-${webhook_payload.entry[0].messaging[0].sender.id}`;
            const smartAICooldown = await enforceSmartAICooldown(
              automation.id,
              conversationId
            );
            
            if (!smartAICooldown.allowed) {
              console.log(
                `⏱️ SMARTAI cooldown active. ${smartAICooldown.remainingTime}s remaining`
              );
              return NextResponse.json(
                { message: "SMARTAI cooldown active" },
                { status: 200 }
              );
            }
            
            // Rate limit OpenAI API calls
            const openaiRateLimitCheck = await checkRateLimit(
              openaiRateLimiter,
              `openai:${automation.id}`
            );
            
            if (!openaiRateLimitCheck.success) {
              console.warn(
                `🚫 OpenAI rate limit exceeded for automation ${automation.id}`
              );
              return NextResponse.json(
                { message: "OpenAI rate limit exceeded" },
                { status: 200 }
              );
            }
            
            // Use retry logic for OpenAI API call
            const smart_ai_message = await retryOpenAI(
              () => openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                  {
                    role: "assistant",
                    content: `${automation.listener?.prompt}: Keep responses under 2 sentences`,
                  },
                ],
              }),
              `SMARTAI DM for automation ${automation.id}`
            );

            if (smart_ai_message.choices[0].message.content) {
              const reciever = createChatHistory(
                automation.id,
                webhook_payload.entry[0].id,
                webhook_payload.entry[0].messaging[0].sender.id,
                webhook_payload.entry[0].messaging[0].message.text
              );

              const sender = createChatHistory(
                automation.id,
                webhook_payload.entry[0].id,
                webhook_payload.entry[0].messaging[0].sender.id,
                smart_ai_message.choices[0].message.content
              );

              await client.$transaction([reciever, sender]);

              const direct_message = await sendDM(
                webhook_payload.entry[0].id,
                webhook_payload.entry[0].messaging[0].sender.id,
                smart_ai_message.choices[0].message.content,
                automation.User?.integrations[0].token!
              );

              if (direct_message.status === 200) {
                const tracked = await trackResponses(automation.id, "DM");
                if (tracked) {
                  return NextResponse.json(
                    {
                      message: "Message sent",
                    },
                    { status: 200 }
                  );
                }
              }
            }
          }
        }
      }

      //Handles incoming comments on a post - sending private replies to comments via the Insta Graph API - /{user-id}/messages
      if (
        webhook_payload.entry[0].changes &&
        webhook_payload.entry[0].changes[0].field === "comments"
      ) {
        //Get automation details
        const automation = await getKeywordAutomation(
          matcher.automationId,
          false
        );

        console.log("geting the automations");

        //Get the post associated with the automation &
        const automations_post = await getKeywordPost(
          webhook_payload.entry[0].changes[0].value.media.id,
          automation?.id!
        );

        console.log("found keyword ", automations_post);

        if (automation && automations_post && automation.trigger) {
          console.log("first if");
          
          // Validate subscription before processing
          const subscriptionValidation = validateAutomationAccess(
            automation.User?.subscription?.plan,
            automation.listener?.listener,
            automation.listener?.dmCount || 0,
            automation.listener?.commentCount || 0,
            true // This is a comment
          );
          
          if (!subscriptionValidation.isValid) {
            logSubscriptionViolation(
              subscriptionValidation,
              automation.User?.clerkId || "unknown",
              "Instagram Comment Automation"
            );
            
            // Send a notification to user about upgrade (optional)
            // For now, we just log and return success to Instagram
            return NextResponse.json(
              {
                message: "Subscription limit reached",
                plan: subscriptionValidation.plan,
              },
              { status: 200 }
            );
          }
          
          // Check global automation cooldown
          const automationCooldown = await checkAutomationCooldown(automation.id);
          if (!automationCooldown.allowed) {
            console.log(
              `⏱️ Automation cooldown active. ${automationCooldown.remainingTime}s remaining`
            );
            return NextResponse.json(
              { message: "Automation in cooldown" },
              { status: 200 }
            );
          }
          
          if (automation.listener) {
            console.log("first if");

            //If a listener is set to send a predefined message, use the sendPrivateMessage function to send message to insta users - The `sendPrivateMessage` function uses the Instagram Graph API endpoint:` /{user-id}/messages
            if (automation.listener.listener === "MESSAGE") {
              // Check comment cooldown
              const cooldown = await enforceCommentCooldown(
                automation.id,
                webhook_payload.entry[0].changes[0].value.media.id,
                webhook_payload.entry[0].changes[0].value.from.id
              );
              
              if (!cooldown.allowed) {
                console.log(
                  `⏱️ Comment cooldown active. ${cooldown.remainingTime}s remaining`
                );
                return NextResponse.json(
                  { message: "Comment cooldown active" },
                  { status: 200 }
                );
              }
              
              console.log(
                "SENDING DM, WEB HOOK PAYLOAD",
                webhook_payload,
                "changes",
                webhook_payload.entry[0].changes[0].value.from
              );

              console.log(
                "COMMENT VERSION:",
                webhook_payload.entry[0].changes[0].value.from.id
              );

              const direct_message = await sendPrivateMessage(
                webhook_payload.entry[0].id,
                webhook_payload.entry[0].changes[0].value.id,
                automation.listener?.prompt,
                automation.User?.integrations[0].token!
              );

              console.log("DM SENT", direct_message.data);
              if (direct_message.status === 200) {
                const tracked = await trackResponses(automation.id, "COMMENT");
                // Set global automation cooldown
                await setAutomationCooldown(automation.id);

                if (tracked) {
                  return NextResponse.json(
                    {
                      message: "Message sent",
                    },
                    { status: 200 }
                  );
                }
              }
            }

            //PREMIUM USER : If a listener is set to use the SMARTAI model, use the OpenAI API to generate a response and sends the message to the user using the same sendPrivateMessage function.
            if (
              automation.listener.listener === "SMARTAI" &&
              automation.User?.subscription?.plan === "PRO"
            ) {
              // Check SMARTAI cooldown for comments
              const conversationId = `${webhook_payload.entry[0].changes[0].value.media.id}-${webhook_payload.entry[0].changes[0].value.from.id}`;
              const smartAICooldown = await enforceSmartAICooldown(
                automation.id,
                conversationId
              );
              
              if (!smartAICooldown.allowed) {
                console.log(
                  `⏱️ SMARTAI cooldown active for comment. ${smartAICooldown.remainingTime}s remaining`
                );
                return NextResponse.json(
                  { message: "SMARTAI cooldown active" },
                  { status: 200 }
                );
              }
              
              // Rate limit OpenAI API calls
              const openaiRateLimitCheck = await checkRateLimit(
                openaiRateLimiter,
                `openai:${automation.id}`
              );
              
              if (!openaiRateLimitCheck.success) {
                console.warn(
                  `🚫 OpenAI rate limit exceeded for automation ${automation.id}`
                );
                return NextResponse.json(
                  { message: "OpenAI rate limit exceeded" },
                  { status: 200 }
                );
              }
              
              // Use retry logic for OpenAI API call
              const smart_ai_message = await retryOpenAI(
                () => openai.chat.completions.create({
                  model: "gpt-4o",
                  messages: [
                    {
                      role: "assistant",
                      content: `${automation.listener?.prompt}: keep responses under 2 sentences`,
                    },
                  ],
                }),
                `SMARTAI Comment for automation ${automation.id}`
              );
              if (smart_ai_message.choices[0].message.content) {
                const reciever = createChatHistory(
                  automation.id,
                  webhook_payload.entry[0].id,
                  webhook_payload.entry[0].changes[0].value.from.id,
                  webhook_payload.entry[0].changes[0].value.text
                );

                const sender = createChatHistory(
                  automation.id,
                  webhook_payload.entry[0].id,
                  webhook_payload.entry[0].changes[0].value.from.id,
                  smart_ai_message.choices[0].message.content
                );

                await client.$transaction([reciever, sender]);

                const direct_message = await sendPrivateMessage(
                  webhook_payload.entry[0].id,
                  webhook_payload.entry[0].changes[0].value.id,
                  automation.listener?.prompt,
                  automation.User?.integrations[0].token!
                );

                if (direct_message.status === 200) {
                  const tracked = await trackResponses(
                    automation.id,
                    "COMMENT"
                  );

                  if (tracked) {
                    return NextResponse.json(
                      {
                        message: "Message sent",
                      },
                      { status: 200 }
                    );
                  }
                }
              }
            }
          }
        }
      }
    }

    //No Match found
    if (!matcher) {
      //Checks for exisiting conversation history between the user and the bot and contiues the conversation for PREMIUM users
      const customer_history = await getChatHistory(
        webhook_payload.entry[0].messaging[0].recipient.id,
        webhook_payload.entry[0].messaging[0].sender.id
      );

      if (customer_history.history.length > 0) {
        const automation = await findAutomation(customer_history.automationId!);

        if (
          automation?.User?.subscription?.plan === "PRO" &&
          automation.listener?.listener === "SMARTAI"
        ) {
          // Validate subscription for conversation continuation
          const subscriptionValidation = validateAutomationAccess(
            automation.User?.subscription?.plan,
            automation.listener?.listener,
            automation.listener?.dmCount || 0,
            automation.listener?.commentCount || 0,
            false
          );
          
          if (!subscriptionValidation.isValid) {
            logSubscriptionViolation(
              subscriptionValidation,
              automation.User?.clerkId || "unknown",
              "Instagram Conversation History"
            );
            return NextResponse.json(
              { message: "Subscription limit reached" },
              { status: 200 }
            );
          }
          
          // Rate limit OpenAI API calls
          const openaiRateLimitCheck = await checkRateLimit(
            openaiRateLimiter,
            `openai:${automation.id}`
          );
          
          if (!openaiRateLimitCheck.success) {
            console.warn(
              `🚫 OpenAI rate limit exceeded for automation ${automation.id}`
            );
            return NextResponse.json(
              { message: "OpenAI rate limit exceeded" },
              { status: 200 }
            );
          }
          
          // Use retry logic for OpenAI API call
          const smart_ai_message = await retryOpenAI(
            () => openai.chat.completions.create({
              model: "gpt-4o",
              messages: [
                {
                  role: "assistant",
                  content: `${automation.listener?.prompt}: keep responses under 2 sentences`,
                },
                ...customer_history.history,
                {
                  role: "user",
                  content: webhook_payload.entry[0].messaging[0].message.text,
                },
              ],
            }),
            `SMARTAI Conversation for automation ${automation.id}`
          );

          if (smart_ai_message.choices[0].message.content) {
            const reciever = createChatHistory(
              automation.id,
              webhook_payload.entry[0].id,
              webhook_payload.entry[0].messaging[0].sender.id,
              webhook_payload.entry[0].messaging[0].message.text
            );

            const sender = createChatHistory(
              automation.id,
              webhook_payload.entry[0].id,
              webhook_payload.entry[0].messaging[0].sender.id,
              smart_ai_message.choices[0].message.content
            );
            await client.$transaction([reciever, sender]);
            const direct_message = await sendDM(
              webhook_payload.entry[0].id,
              webhook_payload.entry[0].messaging[0].sender.id,
              smart_ai_message.choices[0].message.content,
              automation.User?.integrations[0].token!
            );

            if (direct_message.status === 200) {
              //if successfully send we return

              return NextResponse.json(
                {
                  message: "Message sent",
                },
                { status: 200 }
              );
            }
          }
        }
      }

      return NextResponse.json(
        {
          message: "No automation set",
        },
        { status: 200 }
      );
    }
    return NextResponse.json(
      {
        message: "No automation set",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Webhook processing error:", error);
    
    // Log error details for debugging
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    // Always return 200 to Instagram to acknowledge receipt
    // (prevents Instagram from retrying and overloading server)
    return NextResponse.json(
      {
        message: "Webhook received",
        error: process.env.NODE_ENV === "development" 
          ? error instanceof Error ? error.message : "Unknown error"
          : undefined,
      },
      { status: 200 }
    );
  }
}
