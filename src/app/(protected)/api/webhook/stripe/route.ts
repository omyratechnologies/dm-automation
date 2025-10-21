import { stripe } from "@/lib/stripe";
import { updateSubscription } from "@/actions/user/queries";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

/**
 * Stripe Webhook Handler
 * Handles subscription events from Stripe
 * 
 * Events handled:
 * - checkout.session.completed: User completes subscription purchase
 * - customer.subscription.updated: Subscription status changes
 * - customer.subscription.deleted: Subscription canceled
 * - invoice.payment_failed: Payment failure
 * - invoice.payment_succeeded: Successful payment
 */
export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      console.error("❌ Stripe not configured");
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 503 }
      );
    }

    // Get the raw body for signature verification
    const body = await req.text();
    const signature = headers().get("stripe-signature");

    if (!signature) {
      console.error("❌ Missing Stripe signature");
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      );
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("❌ Missing STRIPE_WEBHOOK_SECRET environment variable");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("❌ Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    console.log(`✅ Webhook verified: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(subscription);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("❌ Stripe webhook error:", error);
    return NextResponse.json(
      {
        error: "Webhook handler failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Handle checkout session completion
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log("💳 Processing checkout completion:", session.id);

  const customerId = session.customer as string;
  const clerkUserId = session.client_reference_id;

  if (!clerkUserId) {
    console.error("❌ No client_reference_id found in session");
    return;
  }

  try {
    await updateSubscription(clerkUserId, {
      customerId,
      plan: "PRO",
    });

    console.log(`✅ Subscription activated for user: ${clerkUserId}`);
  } catch (error) {
    console.error("❌ Failed to update subscription:", error);
    throw error;
  }
}

/**
 * Handle subscription creation
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log("🎉 New subscription created:", subscription.id);

  const customerId = subscription.customer as string;

  try {
    // Find user by customerId and update subscription
    const { client } = await import("@/lib/prisma");
    const userSubscription = await client.subscription.findUnique({
      where: { customerId },
      include: { User: true },
    });

    if (userSubscription && userSubscription.User) {
      await updateSubscription(userSubscription.User.clerkId, {
        plan: "PRO",
        customerId,
      });

      console.log(`✅ Subscription created for customer: ${customerId}`);
    } else {
      console.warn(`⚠️ No user found for customer: ${customerId}`);
    }
  } catch (error) {
    console.error("❌ Failed to handle subscription creation:", error);
  }
}

/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log("🔄 Subscription updated:", subscription.id);

  const customerId = subscription.customer as string;
  const status = subscription.status;

  try {
    const { client } = await import("@/lib/prisma");
    const userSubscription = await client.subscription.findUnique({
      where: { customerId },
      include: { User: true },
    });

    if (userSubscription && userSubscription.User) {
      // Update based on status
      const plan = status === "active" ? "PRO" : "FREE";

      await updateSubscription(userSubscription.User.clerkId, {
        plan,
        customerId,
      });

      console.log(
        `✅ Subscription updated: ${customerId} -> ${plan} (${status})`
      );
    } else {
      console.warn(`⚠️ No user found for customer: ${customerId}`);
    }
  } catch (error) {
    console.error("❌ Failed to handle subscription update:", error);
  }
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log("🚫 Subscription canceled:", subscription.id);

  const customerId = subscription.customer as string;

  try {
    const { client } = await import("@/lib/prisma");
    const userSubscription = await client.subscription.findUnique({
      where: { customerId },
      include: { User: true },
    });

    if (userSubscription && userSubscription.User) {
      await updateSubscription(userSubscription.User.clerkId, {
        plan: "FREE",
        customerId,
      });

      console.log(`✅ User downgraded to FREE plan: ${customerId}`);
    } else {
      console.warn(`⚠️ No user found for customer: ${customerId}`);
    }
  } catch (error) {
    console.error("❌ Failed to handle subscription deletion:", error);
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log("💰 Payment succeeded:", invoice.id);

  const customerId = invoice.customer as string;

  try {
    const { client } = await import("@/lib/prisma");
    const userSubscription = await client.subscription.findUnique({
      where: { customerId },
      include: { User: true },
    });

    if (userSubscription && userSubscription.User) {
      // Ensure subscription is active
      await updateSubscription(userSubscription.User.clerkId, {
        plan: "PRO",
        customerId,
      });

      console.log(`✅ Payment confirmed for: ${customerId}`);
    }
  } catch (error) {
    console.error("❌ Failed to handle payment success:", error);
  }
}

/**
 * Handle payment failure
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.error("💸 Payment failed:", invoice.id);

  const customerId = invoice.customer as string;

  try {
    const { client } = await import("@/lib/prisma");
    const userSubscription = await client.subscription.findUnique({
      where: { customerId },
      include: { User: true },
    });

    if (userSubscription && userSubscription.User) {
      console.warn(
        `⚠️ Payment failed for user: ${userSubscription.User.clerkId}`
      );
      
      // Note: Don't immediately downgrade - Stripe will retry
      // After multiple failures, subscription will be canceled
      // and we'll handle it in handleSubscriptionDeleted
    }
  } catch (error) {
    console.error("❌ Failed to handle payment failure:", error);
  }
}
