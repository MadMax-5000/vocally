import { LegalPageHeader } from "@/components/marketing/LegalPageHeader";

const container = "mx-auto w-full max-w-[1200px] px-6";

export default function PrivacyPage() {
  return (
    <main className="min-h-dvh bg-canvas text-ink">
      <LegalPageHeader />
      <div className={[container, "py-section"].join(" ")}>
        <h1 className="font-display text-display-lg tracking-tighter text-balance">
          Privacy Notice
        </h1>

        <div className="mt-8 max-w-[70ch] space-y-6 text-body-md leading-relaxed text-body text-pretty">
          <p>
            <strong className="text-ink">Effective date:</strong> This Privacy Notice describes how Vocally (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) collects, uses, and protects your personal information when you use our AI-powered customer experience platform.
          </p>

          <section className="space-y-3">
            <h2 className="text-display-xs font-display tracking-tight text-ink">1. Information We Collect</h2>
            <p>We collect the following categories of information to provide and improve our service:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong className="text-ink">Account Information:</strong> Name, email address, and profile information when you create an account via Clerk authentication.</li>
              <li><strong className="text-ink">Organization Information:</strong> Company name, billing details, and team member information.</li>
              <li><strong className="text-ink">Call Recordings &amp; Transcripts:</strong> Audio recordings and transcripts of calls handled by our AI agents, including voice data processed through our telephony providers.</li>
              <li><strong className="text-ink">Chat &amp; Messaging Content:</strong> Messages exchanged through chat widgets, WhatsApp, Messenger, Instagram, SMS, and email channels.</li>
              <li><strong className="text-ink">Usage Data:</strong> How you interact with our platform, feature usage, session duration, and analytics via Google Analytics 4.</li>
              <li><strong className="text-ink">Payment Information:</strong> Billing data processed securely through LemonSqueezy. We do not store credit card numbers on our servers.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-display-xs font-display tracking-tight text-ink">2. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Operate and maintain our AI agent platform that handles customer interactions across voice, chat, email, and messaging channels</li>
              <li>Improve AI response accuracy and customer experience quality</li>
              <li>Generate session summaries, sentiment analysis, and quality assurance scores</li>
              <li>Analyze usage patterns to optimize our platform and reduce customer support handling time</li>
              <li>Process billing and manage subscriptions</li>
              <li>Comply with legal obligations and enforce our terms</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-display-xs font-display tracking-tight text-ink">3. Call Recording &amp; Consent</h2>
            <p>
              Our platform plays a &quot;this call may be recorded&quot; message at the start of every voice call as required by applicable laws. Customers who interact with our AI agents have the right to request transfer to a human agent at any time. It is your responsibility to ensure you have obtained proper consent from your customers before recording calls, as required by Morocco Law 09-08, GDPR, or other applicable regulations.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-display-xs font-display tracking-tight text-ink">4. AI Processing</h2>
            <p>
              To deliver our AI agent service, message content and call transcripts are processed through third-party AI providers including OpenRouter (which provides access to models from OpenAI, Anthropic, Google, and others), Deepgram (for speech-to-text transcription), and ElevenLabs (for text-to-speech voice synthesis). These providers process data solely for the purpose of providing the AI service and do not use it to train their models unless you have separately consented to their data usage policies.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-display-xs font-display tracking-tight text-ink">5. Data Sharing</h2>
            <p>We share your information with trusted third-party service providers as necessary to deliver our platform:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong className="text-ink">Twilio:</strong> Voice calls, SMS, and WhatsApp messaging</li>
              <li><strong className="text-ink">OpenRouter:</strong> AI language model processing and embeddings</li>
              <li><strong className="text-ink">Deepgram:</strong> Real-time speech-to-text transcription</li>
              <li><strong className="text-ink">Supabase:</strong> Database hosting and real-time data sync</li>
              <li><strong className="text-ink">Resend:</strong> Email delivery</li>
              <li><strong className="text-ink">LemonSqueezy:</strong> Payment processing and subscription management</li>
              <li><strong className="text-ink">Google Analytics:</strong> Anonymous usage analytics</li>
              <li><strong className="text-ink">Clerk:</strong> Authentication and organization management</li>
            </ul>
            <p>We never sell your personal information to third parties.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-display-xs font-display tracking-tight text-ink">6. Data Retention</h2>
            <p>
              We retain call recordings, transcripts, and message history for as long as your account is active or as needed to provide the service. You can request deletion of your data at any time. Analytics data is retained in anonymized form for platform improvement purposes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-display-xs font-display tracking-tight text-ink">7. Your Rights</h2>
            <p>Under Morocco Law 09-08 and applicable data protection regulations, you have the right to:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Restrict or object to processing of your data</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time where processing is based on consent</li>
            </ul>
            <p>To exercise these rights, contact us at the email address below.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-display-xs font-display tracking-tight text-ink">8. International Data Transfers</h2>
            <p>
              Your data may be processed in countries where our service providers operate, including the United States and the European Union. We ensure appropriate safeguards are in place through standard contractual clauses and data processing agreements.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-display-xs font-display tracking-tight text-ink">9. Security</h2>
            <p>
              We implement industry-standard security measures including encryption in transit (TLS) and at rest, row-level security in our database, and strict access controls. However, no method of electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-display-xs font-display tracking-tight text-ink">10. Contact</h2>
            <p>
              For privacy-related inquiries, please contact us at:<br />
              Email: privacy@vocally.app<br />
              Address: Vocally HQ, Morocco
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-display-xs font-display tracking-tight text-ink">11. Changes to This Notice</h2>
            <p>
              We may update this Privacy Notice from time to time. We will notify you of material changes via email or through the platform. Continued use of the service after changes constitutes acceptance of the updated notice.
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
