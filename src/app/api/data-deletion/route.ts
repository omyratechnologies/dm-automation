import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * Meta Data Deletion Callback Endpoint
 * This endpoint is required by Meta for apps using Facebook/Instagram Login
 * 
 * When a user deletes their Facebook/Instagram account or removes your app,
 * Meta will send a request to this endpoint to notify you to delete their data.
 * 
 * URL to provide to Meta: https://yourdomain.com/api/data-deletion
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Parse the signed_request from Meta
    const signedRequest = body.signed_request;
    
    if (!signedRequest) {
      return NextResponse.json(
        { error: "Missing signed_request parameter" },
        { status: 400 }
      );
    }

    // Verify and decode the signed request
    const [encodedSig, payload] = signedRequest.split(".");
    
    // Decode the payload
    const data = JSON.parse(
      Buffer.from(payload, "base64").toString("utf-8")
    );

    // Verify the signature (optional but recommended)
    const appSecret = process.env.INSTAGRAM_APP_SECRET || "";
    const expectedSig = crypto
      .createHmac("sha256", appSecret)
      .update(payload)
      .digest("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");

    const receivedSig = encodedSig.replace(/\+/g, "-").replace(/\//g, "_");

    if (receivedSig !== expectedSig) {
      console.error("❌ Invalid signature on data deletion request");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    // Extract user information
    const userId = data.user_id; // The user's Facebook/Instagram ID
    const algorithm = data.algorithm; // Should be "HMAC-SHA256"
    const issuedAt = data.issued_at; // Unix timestamp

    console.log("📧 Data deletion request received:", {
      userId,
      algorithm,
      issuedAt: new Date(issuedAt * 1000).toISOString(),
    });

    // Implement data deletion logic
    try {
      // Dynamically import Prisma client
      const { PrismaClient } = await import("@prisma/client");
      const prisma = new PrismaClient();

      // Find the user by Instagram ID
      const integration = await prisma.integrations.findFirst({
        where: {
          instagramId: userId,
        },
        include: {
          User: {
            include: {
              automations: {
                include: {
                  dms: true,
                  posts: true,
                  keywords: true,
                  trigger: true,
                  listener: true,
                },
              },
              subscription: true,
            },
          },
        },
      });

      if (integration && integration.User) {
        const user = integration.User;
        
        console.log(`🗑️ Deleting data for user: ${user.id} (Instagram ID: ${userId})`);

        // Delete all user data in the correct order (child records first)
        // 1. Delete DMs
        await prisma.dms.deleteMany({
          where: {
            Automation: {
              userId: user.id,
            },
          },
        });

        // 2. Delete Posts
        await prisma.post.deleteMany({
          where: {
            Automation: {
              userId: user.id,
            },
          },
        });

        // 3. Delete Keywords
        await prisma.keyword.deleteMany({
          where: {
            Automation: {
              userId: user.id,
            },
          },
        });

        // 4. Delete Listeners
        await prisma.listener.deleteMany({
          where: {
            Automation: {
              userId: user.id,
            },
          },
        });

        // 5. Delete Triggers
        await prisma.trigger.deleteMany({
          where: {
            Automation: {
              userId: user.id,
            },
          },
        });

        // 6. Delete Automations
        await prisma.automation.deleteMany({
          where: {
            userId: user.id,
          },
        });

        // 7. Delete Integrations
        await prisma.integrations.deleteMany({
          where: {
            userId: user.id,
          },
        });

        // 8. Delete Subscription
        if (user.subscription) {
          await prisma.subscription.delete({
            where: {
              id: user.subscription.id,
            },
          });
        }

        // 9. Finally, delete the User
        await prisma.user.delete({
          where: {
            id: user.id,
          },
        });

        console.log(`✅ Successfully deleted all data for user: ${user.id}`);
      } else {
        console.log(`ℹ️ No user found with Instagram ID: ${userId}`);
      }

      await prisma.$disconnect();
    } catch (dbError) {
      console.error("❌ Database deletion error:", dbError);
      // Continue to return success to Meta even if user not found
    }

    // Generate a unique confirmation code
    const confirmationCode = crypto.randomBytes(16).toString("hex");
    const statusUrl = `${process.env.NEXT_PUBLIC_HOST_URL}/data-deletion-status/${confirmationCode}`;

    // Store the confirmation code and deletion status in your database
    try {
      const { PrismaClient } = await import("@prisma/client");
      const prisma = new PrismaClient();
      
      await prisma.dataDeletionRequest.create({
        data: {
          confirmationCode,
          userId: userId,
          status: "completed",
          completedAt: new Date(),
        },
      });
      
      await prisma.$disconnect();
    } catch (dbError) {
      console.error("❌ Failed to store deletion request:", dbError);
    }
    
    console.log("✅ Data deletion queued:", {
      userId,
      confirmationCode,
      statusUrl,
    });

    // Return the confirmation URL and code to Meta
    return NextResponse.json({
      url: statusUrl,
      confirmation_code: confirmationCode,
    });

  } catch (error) {
    console.error("❌ Error processing data deletion request:", error);
    return NextResponse.json(
      { error: "Failed to process deletion request" },
      { status: 500 }
    );
  }
}

// Handle GET requests (for testing)
export async function GET(req: NextRequest) {
  return NextResponse.json({
    message: "Meta Data Deletion Callback Endpoint",
    description: "This endpoint handles data deletion requests from Meta",
    method: "POST only",
    documentation: "https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback",
  });
}
