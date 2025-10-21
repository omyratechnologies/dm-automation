import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/contact",
  "/privacy-policy",
  "/terms",
  "/cookies",
  "/gdpr",
  "/api/webhook/instagram(.*)",
  "/api/webhook/stripe(.*)",
]);

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/api/payment(.*)",
  "/callback(.*)",
  "/payment(.*)",
]);

export default clerkMiddleware((auth, req) => {
  // Protect all protected routes
  if (isProtectedRoute(req)) {
    auth.protect();
  }
  
  // Public routes automatically pass through without auth check
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
