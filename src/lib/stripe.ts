import Stripe from "stripe";

// Only initialize Stripe if the secret key is provided
export const stripe = process.env.STRIPE_CLIENT_SECRET 
  ? new Stripe(process.env.STRIPE_CLIENT_SECRET, {
      apiVersion: "2024-12-18.acacia",
    })
  : null;
