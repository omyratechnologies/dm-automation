/**
 * Await Clerk's protection result so its redirect control flow is handled by
 * clerkMiddleware instead of escaping as an unhandled NEXT_REDIRECT rejection.
 */
export async function protectMatchedRoute(
  isProtected: boolean,
  protect: () => Promise<unknown>,
): Promise<void> {
  if (!isProtected) return;

  await protect();
}
