import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);
const isOnboardingRoute = createRouteMatcher(["/onboarding"]);
const isWebhookRoute = createRouteMatcher(["/api/webhooks(.*)"]);
const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)", "/privacy", "/terms", "/cookies"]);

export default clerkMiddleware(async (auth, req) => {
  const url = new URL(req.url);

  if (isWebhookRoute(req)) {
    return;
  }

  if (!isPublicRoute(req) && !isProtectedRoute(req) && !isOnboardingRoute(req)) {
    return;
  }

  const session = await auth();

  if (!session.userId) {
    return session.redirectToSignIn({ returnBackUrl: req.url });
  }

  if (!session.orgId && !isOnboardingRoute(req)) {
    return Response.redirect(new URL("/onboarding", req.url));
  }

  if (session.orgId && isOnboardingRoute(req)) {
    return Response.redirect(new URL("/dashboard", req.url));
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/"]
};

