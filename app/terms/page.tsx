import { LegalPageHeader } from "@/components/marketing/LegalPageHeader";
import { BRAND_EMAILS } from "@/lib/constants/brand";

const container = "mx-auto w-full max-w-[1200px] px-6";

export default function TermsPage() {
  return (
    <main className="min-h-dvh bg-canvas text-ink">
      <LegalPageHeader />
      <div className={[container, "py-section"].join(" ")}>
        <h1 className="font-display text-display-lg tracking-tighter text-balance">
          Terms of Service
        </h1>

        <div className="mt-8 max-w-[70ch] space-y-6 text-body-md leading-relaxed text-body text-pretty">
          <p>
            <strong className="text-ink">Effective date:</strong> By accessing or using Anselio (&quot;the Platform&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Platform.
          </p>

          <section className="space-y-3">
            <h2 className="text-display-xs font-display tracking-tight text-ink">1. Service Description</h2>
            <p>
              Anselio is an AI-powered Contact Center as a Service (CCaaS) platform that provides AI agents capable of handling customer interactions across voice, chat, email, SMS, WhatsApp, Messenger, and Instagram channels. Our platform is designed to deliver premium customer experiences by automating up to 80% of routine customer support inquiries, allowing you to focus on what matters most to your business.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-display-xs font-display tracking-tight text-ink">2. Account Registration</h2>
            <p>
              You must create an account through Clerk authentication to use the Platform. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate and complete information during registration.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-display-xs font-display tracking-tight text-ink">3. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Use the Platform for any illegal activity or in violation of any applicable laws, including Morocco Law 09-08 on data protection</li>
              <li>Abuse, harass, or misuse our AI agents in any way</li>
              <li>Attempt to reverse engineer, decompile, or extract the source code of the Platform</li>
              <li>Resell or sublicense access to the Platform without a written agreement with Anselio</li>
              <li>Use the Platform to process sensitive information (credit card numbers, PINs, passwords) through voice channels — such information must be collected via DTMF keypad input only</li>
              <li>Interfere with the proper functioning of the Platform</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-display-xs font-display tracking-tight text-ink">4. Subscription &amp; Payment</h2>
            <p>
              Subscription plans (FREE, STARTER, PRO, ENTERPRISE) are billed through LemonSqueezy on a monthly or annual basis as selected during checkout. Payments are processed securely by LemonSqueezy, and we do not store payment card information. Subscriptions automatically renew unless cancelled. Refunds are handled in accordance with LemonSqueezy&apos;s refund policy and applicable consumer protection laws.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-display-xs font-display tracking-tight text-ink">5. AI Service Level</h2>
            <p>
              Our AI agents are designed to handle customer interactions with high accuracy, but they are not perfect. You acknowledge that:
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>AI responses may occasionally contain errors or inaccuracies</li>
              <li>The Platform provides a &quot;speak to a human&quot; escalation option for every interaction — this is a non-negotiable feature</li>
              <li>You are responsible for reviewing AI-generated summaries and quality scores</li>
              <li>We continuously improve our AI models but make no guarantee of specific resolution rates or handle times</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-display-xs font-display tracking-tight text-ink">6. Call Recording &amp; Consent</h2>
            <p>
              You are responsible for complying with all applicable laws regarding call recording consent in your jurisdiction. The Platform automatically plays a &quot;this call may be recorded&quot; disclosure at the start of each voice call. You warrant that you will obtain any additional consent required from your customers before using the Platform to record calls.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-display-xs font-display tracking-tight text-ink">7. Intellectual Property</h2>
            <p>
              The Anselio platform, including its software, design, branding, and AI models, is the intellectual property of Anselio. You retain all rights to your customer data, business information, and any content you upload to the Platform. You grant us a limited license to process your data as necessary to provide the service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-display-xs font-display tracking-tight text-ink">8. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, Anselio shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform. Our total liability for any claim shall not exceed the amount you have paid us in the twelve months preceding the claim.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-display-xs font-display tracking-tight text-ink">9. Termination</h2>
            <p>
              Either party may terminate this agreement at any time. Upon termination, you may export your data within 30 days. After that period, we may permanently delete your data in accordance with our data retention policy. We reserve the right to suspend or terminate accounts that violate these terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-display-xs font-display tracking-tight text-ink">10. Governing Law</h2>
            <p>
              These Terms are governed by the laws of Morocco, including Law 09-08 on the protection of individuals with regard to the processing of personal data. Any disputes shall be resolved in the courts of Morocco.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-display-xs font-display tracking-tight text-ink">11. Contact</h2>
            <p>
              For questions about these Terms, contact us at:<br />
              Email: {BRAND_EMAILS.legal}<br />
              Address: Anselio HQ, Morocco
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
