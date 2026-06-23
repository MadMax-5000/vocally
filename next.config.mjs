import { withSentryConfig } from "@sentry/nextjs";

const hasSentrySourcemapUpload = Boolean(process.env.SENTRY_AUTH_TOKEN);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  experimental: {
    // Reduce peak RAM during webpack compile (Next.js 14.2+).
    webpackMemoryOptimizations: true,
    // Run webpack in a worker process to lower main-process memory.
    webpackBuildWorker: true,
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  // Source maps are memory-heavy; only generate when we can upload them.
  sourcemaps: {
    disable: !hasSentrySourcemapUpload,
  },
  widenClientFileUpload: hasSentrySourcemapUpload,
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: false,
});
