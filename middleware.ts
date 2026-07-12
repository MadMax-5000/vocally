import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { defaultLocale } from './i18n/config';
import { getRequestLocale } from "./lib/i18n/request-locale";

const handleI18nRouting = createMiddleware(routing);

const isLocalizedDashboardRoute = createRouteMatcher(["/(fr|en|ar)/dashboard(.*)"]);
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

  if (req.nextUrl.pathname === "/dashboard" || req.nextUrl.pathname.startsWith("/dashboard/")) {
    const locale = getRequestLocale(req.headers);
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}${req.nextUrl.pathname}`;
    return Response.redirect(url, 308);
  }

  if (isLocalizedDashboardRoute(req)) {
    if (!session.userId) {
      return session.redirectToSignIn({ returnBackUrl: req.url });
    }
    if (!session.orgId) {
      const locale = req.nextUrl.pathname.split("/")[1] ?? defaultLocale;
      return Response.redirect(new URL(`/${locale}/onboarding`, req.url));
    }
    return handleI18nRouting(req);
  }

  if (isOnboardingRoute(req)) {
    if (!session.userId) {
      return session.redirectToSignIn({ returnBackUrl: req.url });
    }
    if (session.orgId) {
      const locale = req.nextUrl.pathname.split("/")[1] ?? getRequestLocale(req.headers);
      return Response.redirect(new URL(`/${locale}/dashboard`, req.url));
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

