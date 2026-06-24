import { LegalPageHeader } from "@/components/marketing/LegalPageHeader";

const container = "mx-auto w-full max-w-[1200px] px-6";

export default function CookiesPage() {
  return (
    <main className="min-h-dvh bg-canvas text-ink">
      <LegalPageHeader />
      <div className={[container, "py-section"].join(" ")}>
        <h1 className="font-display text-display-lg tracking-tighter text-balance">
          Cookie Notice
        </h1>

        <div className="mt-8 max-w-[70ch] space-y-6 text-body-md leading-relaxed text-body text-pretty">
          <p>
            <strong className="text-ink">Effective date:</strong> This Cookie Notice explains how Vocally uses cookies and similar tracking technologies on our platform.
          </p>

          <section className="space-y-3">
            <h2 className="text-display-xs font-display tracking-tight text-ink">1. What Are Cookies</h2>
            <p>
              Cookies are small text files stored on your device by your web browser. They help websites remember your preferences, authenticate your sessions, and understand how you use the platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-display-xs font-display tracking-tight text-ink">2. Cookies We Use</h2>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong className="text-ink">Authentication (Clerk):</strong> Essential cookies that manage your login session and organization context. Without these, the dashboard cannot function.</li>
              <li><strong className="text-ink">Analytics (Google Analytics 4):</strong> Cookies that help us understand how visitors interact with our website and dashboard, including page views, feature usage, and session duration. This data is anonymized and does not include personal information such as names, phone numbers, or transcript content.</li>
              <li><strong className="text-ink">Billing (LemonSqueezy):</strong> Cookies used during the checkout process to manage subscription transactions.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-display-xs font-display tracking-tight text-ink">3. Third-Party Cookies</h2>
            <p>
              Some cookies are placed by third-party services we use:
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong className="text-ink">Google Analytics</strong> — anonymous usage analytics (see Google&apos;s privacy policy for opt-out options)</li>
              <li><strong className="text-ink">Clerk</strong> — authentication and session management</li>
              <li><strong className="text-ink">LemonSqueezy</strong> — payment processing</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-display-xs font-display tracking-tight text-ink">4. Managing Cookies</h2>
            <p>
              You can control cookies through your browser settings. Most browsers allow you to block or delete cookies. However, blocking essential cookies may prevent the platform from functioning properly. To opt out of Google Analytics specifically, you can install the Google Analytics Opt-out Browser Add-on.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-display-xs font-display tracking-tight text-ink">5. Changes to This Notice</h2>
            <p>
              We may update this Cookie Notice from time to time. Changes will be posted on this page with an updated effective date.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-display-xs font-display tracking-tight text-ink">6. Contact</h2>
            <p>
              For questions about our use of cookies, contact us at:<br />
              Email: privacy@vocally.app
            </p>
          </section>

          <p className="text-caption text-muted pt-4">
            Last updated: June 2026
          </p>
        </div>
      </div>
    </main>
  );
}
