import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createMiddleware from 'next-intl/middleware';
import type { NextFetchEvent, NextRequest } from "next/server";
import { routing } from './i18n/routing';
import { defaultLocale } from './i18n/config';
import { isClerkConfigured } from "./lib/clerk/keys";
import { getRequestLocale } from "./lib/i18n/request-locale";

const handleI18nRouting = createMiddleware(routing);

const isLocalizedDashboardRoute = createRouteMatcher(["/(fr|en|ar)/dashboard(.*)"]);
const isOnboardingRoute = createRouteMatcher(["/(fr|en|ar)/onboarding", "/onboarding"]);
const isWebhookRoute = createRouteMatcher(["/api/webhooks(.*)", "/api/cron(.*)"]);
const isApiRoute = createRouteMatcher(["/api(.*)"]);
const isPublicEmbedRoute = createRouteMatcher(["/help(.*)", "/widget(.*)"]);
const isLocalizedEmbedRoute = createRouteMatcher([
  "/(fr|en|ar)/help(.*)",
  "/(fr|en|ar)/widget(.*)",
]);

const isI18nRoute = createRouteMatcher([
  '/',
  '/(fr|en|ar)(.*)',
  '/pricing',
  '/privacy',
  '/terms',
  '/cookies',
  '/legal',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/onboarding'
]);

function redirectBareDashboard(req: NextRequest): Response | null {
  if (req.nextUrl.pathname === "/dashboard" || req.nextUrl.pathname.startsWith("/dashboard/")) {
    const locale = getRequestLocale(req.headers);
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}${req.nextUrl.pathname}`;
    return Response.redirect(url, 308);
  }
  return null;
}

function handleEmbedAndI18n(req: NextRequest): Response | undefined {
  if (isLocalizedEmbedRoute(req)) {
    const locale = req.nextUrl.pathname.split("/")[1];
    const url = req.nextUrl.clone();
    url.pathname = req.nextUrl.pathname.slice(`/${locale}`.length) || "/";
    return Response.redirect(url, 308);
  }

  if (isPublicEmbedRoute(req)) {
    return;
  }

  if (isI18nRoute(req)) {
    return handleI18nRouting(req);
  }

  const locale = getRequestLocale(req.headers);
  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${req.nextUrl.pathname}`;
  return Response.redirect(url, 308);
}

function handleRequestWithoutClerk(req: NextRequest): Response | undefined {
  if (isWebhookRoute(req) || isApiRoute(req)) return;

  const dashboardRedirect = redirectBareDashboard(req);
  if (dashboardRedirect) return dashboardRedirect;

  if (isLocalizedDashboardRoute(req) || isOnboardingRoute(req)) {
    const locale = req.nextUrl.pathname.split("/")[1] ?? getRequestLocale(req.headers);
    return Response.redirect(new URL(`/${locale}/sign-in`, req.url));
  }

  return handleEmbedAndI18n(req);
}

const clerkHandler = clerkMiddleware(async (auth, req) => {
  if (isWebhookRoute(req) || isApiRoute(req)) return;

  const session = await auth();

  const dashboardRedirect = redirectBareDashboard(req);
  if (dashboardRedirect) return dashboardRedirect;

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

  return handleEmbedAndI18n(req);
});

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  // Placeholder keys decode to clerk.example.com. Clerk's handshake would DNS-fail
  // before the homepage can render (`__clerk_hs_reason=dev-browser-missing`).
  if (!isClerkConfigured()) {
    return handleRequestWithoutClerk(req);
  }
  return clerkHandler(req, event);
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/"]
};

