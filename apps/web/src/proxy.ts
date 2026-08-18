import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { protectMatchedRoute } from "@/auth/protect-route";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/admin(.*)",
  "/api/payment(.*)",
  "/callback(.*)",
  "/payment(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  await protectMatchedRoute(isProtectedRoute(req), () => auth.protect());
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
