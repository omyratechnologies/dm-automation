import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

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

export default clerkMiddleware(async (auth, req) => {
  try {
    // Allow public routes without authentication
    if (isPublicRoute(req)) {
      return NextResponse.next();
    }

    // Protect authenticated routes
    if (isProtectedRoute(req)) {
      await auth.protect();
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    
    // For API routes, return JSON error
    if (req.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }
    
    // For page routes, redirect to sign-in
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
