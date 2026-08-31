import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const hasSentrySourcemapUpload = Boolean(process.env.SENTRY_AUTH_TOKEN);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  transpilePackages: ["@lottiefiles/dotlottie-react"],
  experimental: {
    // Run webpack in a worker process to lower main-process memory.
    webpackBuildWorker: true,
  },
};

export default withSentryConfig(withNextIntl(nextConfig), {
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
