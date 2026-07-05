import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const handleI18nRouting = createMiddleware(routing);

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);
const isOnboardingRoute = createRouteMatcher(["/(fr|en|ar)/onboarding", "/onboarding"]);
const isWebhookRoute = createRouteMatcher(["/api/webhooks(.*)", "/api/cron(.*)"]);

const isI18nRoute = createRouteMatcher([
  '/',
  '/(fr|en|ar)(.*)',
  '/pricing',
  '/privacy',
  '/terms',
  '/cookies',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/onboarding'
]);

export default clerkMiddleware(async (auth, req) => {
  if (isWebhookRoute(req)) return;

  const session = await auth();

  if (isProtectedRoute(req)) {
    if (!session.userId) {
      return session.redirectToSignIn({ returnBackUrl: req.url });
    }
    if (!session.orgId) {
      return Response.redirect(new URL("/fr/onboarding", req.url));
    }
    return;
  }

  if (isOnboardingRoute(req)) {
    if (!session.userId) {
      return session.redirectToSignIn({ returnBackUrl: req.url });
    }
    if (session.orgId) {
      return Response.redirect(new URL("/dashboard", req.url));
    }
    return handleI18nRouting(req);
  }

  if (isI18nRoute(req)) {
    return handleI18nRouting(req);
  }

  return;
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/"]
};

