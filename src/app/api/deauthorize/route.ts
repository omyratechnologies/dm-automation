import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { client } from "@/lib/prisma";

/**
 * Meta Deauthorize Callback Endpoint
 * This endpoint is called when a user deauthorizes your app (removes permissions)
 * 
 * When a user removes your app from their Facebook/Instagram settings,
 * Meta will send a request to this endpoint to notify you.
 * 
 * URL to provide to Meta: https://gemai.omyratech.com/api/deauthorize
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Parse the signed_request from Meta
    const signedRequest = body.signed_request;
    
    if (!signedRequest) {
      console.error("❌ Missing signed_request parameter");
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

    // Verify the signature
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
      console.error("❌ Invalid signature on deauthorize request");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    // Extract user_id from the signed request
    const userId = data.user_id;
    
    console.log("📧 Deauthorize request received:", {
      userId,
      algorithm: data.algorithm,
      issuedAt: data.issued_at,
    });

    // Find user by Instagram user ID
    const user = await client.user.findFirst({
      where: {
        integrations: {
          some: {
            instagramId: userId,
          },
        },
      },
      include: {
        integrations: true,
      },
    });

    if (user) {
      console.log("🔄 Deauthorizing user:", user.email);

      // Mark integration as deauthorized or delete it
      await client.integrations.deleteMany({
        where: {
          userId: user.id,
          instagramId: userId,
        },
      });

      console.log("✅ Integration removed for user:", user.email);

      // Optionally: Notify user via email that their connection was removed
      // await sendDeauthorizeEmail(user.email);

      return NextResponse.json(
        {
          success: true,
          message: "App deauthorized successfully",
        },
        { status: 200 }
      );
    } else {
      console.log("⚠️ User not found for Instagram ID:", userId);
      
      // Still return success to Meta (user might have already deleted account)
      return NextResponse.json(
        {
          success: true,
          message: "User not found, but request acknowledged",
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("❌ Error processing deauthorize request:", error);
    
    // Always return success to Meta to avoid retries
    return NextResponse.json(
      {
        success: true,
        message: "Request processed",
      },
      { status: 200 }
    );
  }
}

// GET endpoint for testing/verification
export async function GET(req: NextRequest) {
  return NextResponse.json({
    message: "Meta Deauthorize Callback Endpoint",
    description: "This endpoint handles deauthorization requests from Meta",
    status: "active",
    endpoint: "/api/deauthorize",
    method: "POST",
    documentation: "https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback",
  });
}
