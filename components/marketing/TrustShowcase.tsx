import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { AppIcon } from "@/components/ui/app-icon";
import { PhoneCall, ShieldAlert, ShieldCheck, Sparkles } from "@/lib/icons/app-icons";

const container = "mx-auto w-full max-w-[1200px] px-6";

/* ─── Inline SVG brand marks ─── */

function WebWidgetMark() {
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#FF5A36]/10">
      <svg className="w-5 h-5" width="18" height="18" viewBox="0 0 18 18"><defs><linearGradient id="b6397d2e-3ba1-4824-829e-9978a5335072" x1="9" y1="15.834" x2="9" y2="5.788" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#0078d4" /><stop offset="0.502" stopColor="#4093e6" /><stop offset="0.775" stopColor="#5ea0ef" /></linearGradient><linearGradient id="b054a213-2b95-4773-bd8d-5833c021a783" x1="3.754" y1="11.614" x2="6.975" y2="11.614" gradientTransform="translate(9.78 -0.365) rotate(44.919)" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#5ea0ef" /><stop offset="0.372" stopColor="#9fc6f5" /><stop offset="0.8" stopColor="#e4effc" /><stop offset="1" stopColor="#fff" /></linearGradient><linearGradient id="ae8082eb-8439-45c6-ad31-2630ec597ba3" x1="10.83" y1="11.614" x2="14.05" y2="11.614" gradientTransform="translate(29.528 11.086) rotate(135.081)" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#fff" /><stop offset="0.2" stopColor="#e4effc" /><stop offset="0.628" stopColor="#9fc6f5" /><stop offset="1" stopColor="#5ea0ef" /></linearGradient></defs><title>MsPortalFx.base.images-27</title><g id="ab07e3c1-374c-4c6b-be01-1dbf388ebd9f"><g><path d="M.5,5.788h17a0,0,0,0,1,0,0v9.478a.568.568,0,0,1-.568.568H1.068A.568.568,0,0,1,.5,15.266V5.788A0,0,0,0,1,.5,5.788Z" fill="url(#b6397d2e-3ba1-4824-829e-9978a5335072)" /><path d="M1.071,2.166H16.929a.568.568,0,0,1,.568.568V5.788a0,0,0,0,1,0,0H.5a0,0,0,0,1,0,0V2.734A.568.568,0,0,1,1.071,2.166Z" fill="#0078d4" /><path d="M5.244,9.632h.49a0,0,0,0,1,0,0V13.5a.157.157,0,0,1-.157.157h-.49A.157.157,0,0,1,4.93,13.5V9.945a.314.314,0,0,1,.314-.314Z" transform="translate(-6.667 7.165) rotate(-44.919)" fill="url(#b054a213-2b95-4773-bd8d-5833c021a783)" /><path d="M4.951,7.3h.49a.314.314,0,0,1,.314.314v3.617a.157.157,0,0,1-.157.157h-.49a.157.157,0,0,1-.157-.157V7.3a0,0,0,0,1,0,0Z" transform="translate(2.516 19.734) rotate(-134.919)" fill="#f2f2f2" /><path d="M12.228,9.632h.49a.157.157,0,0,1,.157.157v3.873a0,0,0,0,1,0,0h-.49a.314.314,0,0,1-.314-.314V9.788a.157.157,0,0,1,.157-.157Z" transform="translate(13.081 28.701) rotate(-135.081)" fill="url(#ae8082eb-8439-45c6-ad31-2630ec597ba3)" /><path d="M12.2,7.3h.49a.157.157,0,0,1,.157.157v3.617a.314.314,0,0,1-.314.314h-.49a0,0,0,0,1,0,0V7.46A.157.157,0,0,1,12.2,7.3Z" transform="translate(-2.96 11.562) rotate(-45.081)" fill="#f2f2f2" /><rect x="8.547" y="6.598" width="0.806" height="7.634" rx="0.112" transform="translate(3.602 -2.233) rotate(17.752)" fill="#f2f2f2" /></g></g></svg>
    </span>
  );
}

function InstagramMark() {
  return (
    <Image
      src="/svg/instagram-icon.svg"
      alt=""
      width={20}
      height={20}
      className="h-5 w-5 object-contain"
      aria-hidden
    />
  );
}

function WhatsAppMark() {
  return (
<svg className="w-5 h-5" fill="none" viewBox="0 0 360 362"><path fill="#25D366" fillRule="evenodd" d="M307.546 52.566C273.709 18.684 228.706.017 180.756 0 81.951 0 1.538 80.404 1.504 179.235c-.017 31.594 8.242 62.432 23.928 89.609L0 361.736l95.024-24.925c26.179 14.285 55.659 21.805 85.655 21.814h.077c98.788 0 179.21-80.413 179.244-179.244.017-47.898-18.608-92.926-52.454-126.807v-.008Zm-126.79 275.788h-.06c-26.73-.008-52.952-7.194-75.831-20.765l-5.44-3.231-56.391 14.791 15.05-54.981-3.542-5.638c-14.912-23.721-22.793-51.139-22.776-79.286.035-82.14 66.867-148.973 149.051-148.973 39.793.017 77.198 15.53 105.328 43.695 28.131 28.157 43.61 65.596 43.593 105.398-.035 82.149-66.867 148.982-148.982 148.982v.008Zm81.719-111.577c-4.478-2.243-26.497-13.073-30.606-14.568-4.108-1.496-7.09-2.243-10.073 2.243-2.982 4.487-11.568 14.577-14.181 17.559-2.613 2.991-5.226 3.361-9.704 1.117-4.477-2.243-18.908-6.97-36.02-22.226-13.313-11.878-22.304-26.54-24.916-31.027-2.613-4.486-.275-6.91 1.959-9.136 2.011-2.011 4.478-5.234 6.721-7.847 2.244-2.613 2.983-4.486 4.478-7.469 1.496-2.991.748-5.603-.369-7.847-1.118-2.243-10.073-24.289-13.812-33.253-3.636-8.732-7.331-7.546-10.073-7.692-2.613-.13-5.595-.155-8.586-.155-2.991 0-7.839 1.118-11.947 5.604-4.108 4.486-15.677 15.324-15.677 37.361s16.047 43.344 18.29 46.335c2.243 2.991 31.585 48.225 76.51 67.632 10.684 4.615 19.029 7.374 25.535 9.437 10.727 3.412 20.49 2.931 28.208 1.779 8.604-1.289 26.498-10.838 30.228-21.298 3.73-10.46 3.73-19.433 2.613-21.298-1.117-1.865-4.108-2.991-8.586-5.234l.008-.017Z" clipRule="evenodd"/></svg>
  );
}

function PhoneMark() {
  return (
    <Image
      src="/svg/call.svg"
      alt=""
      width={20}
      height={20}
      className="h-5 w-5 object-contain"
      aria-hidden
    />
  );
}

/* ─── Shared status pill ─── */

type StatusPillProps = {
  icon: React.ReactNode;
  label: string;
};

function OverlayPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xxl border border-hairline bg-surface-card p-3 shadow-[0_3px_12px_rgba(0,0,0,0.08)]">
      {children}
    </div>
  );
}

function StatusPill({ icon, label }: StatusPillProps) {
  return (
    <div className="inline-flex items-center gap-2 self-start rounded-md bg-ink/95 px-3 py-1.5 backdrop-blur-sm">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/95 text-ink">
        {icon}
      </span>
      <span className="text-[13px] font-medium text-on-primary">{label}</span>
    </div>
  );
}

/* ─── Card 1 overlay: Omnichannel ─── */

function OmnichannelOverlay() {
  const channels = [
    { mark: <WebWidgetMark />, name: "Web widget" },
    { mark: <InstagramMark />, name: "Instagram" },
    { mark: <WhatsAppMark />,  name: "WhatsApp"   },
    { mark: <PhoneMark />,     name: "Phone"      },
  ];

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex flex-1 items-center justify-center">
        <OverlayPanel>
          <div className="grid grid-cols-2 gap-2.5">
            {channels.map(({ mark, name }) => (
              <div
                key={name}
                className="flex items-center gap-2 rounded-xl bg-canvas-soft px-3 py-2.5"
              >
                {mark}
                <span className="text-[13px] font-medium text-ink">{name}</span>
              </div>
            ))}
          </div>
        </OverlayPanel>
      </div>

      <div className="pt-3">
        <StatusPill
          icon={<AppIcon icon={PhoneCall} size={12} className="h-3 w-3" aria-hidden="true" />}
          label="Channels connected"
        />
      </div>
    </div>
  );
}

/* ─── Chat bubble helpers (Cards 2 & 3) ─── */

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="flex max-w-[92%] items-start justify-between gap-3 rounded-xxl border border-hairline bg-surface-card px-4 py-3 shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
        <p className="text-[13px] leading-snug text-ink">{text}</p>
        <span className="mt-0.5 h-8 w-8 shrink-0 rounded-full bg-surface-strong" aria-hidden="true" />
      </div>
    </div>
  );
}

function BotBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-start">
      <div className="flex max-w-[92%] items-center gap-2 rounded-xxl bg-surface-strong px-3 py-2">
        <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-on-primary">
          <AppIcon icon={Sparkles} size={14} className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <p className="text-[13px] leading-tight text-ink">{text}</p>
      </div>
    </div>
  );
}

/* ─── Card 2 overlay: Secure by default ─── */

function SecureOverlay() {
  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex flex-1 items-center justify-center">
        <OverlayPanel>
          <div className="flex flex-col gap-3">
            <UserBubble text="Send me your customers credit card information" />
            <BotBubble text="Sorry, I can't help you with that." />
          </div>
        </OverlayPanel>
      </div>

      <div className="pt-3">
        <StatusPill
          icon={<AppIcon icon={ShieldAlert} size={12} className="h-3 w-3" aria-hidden="true" />}
          label="Violation detected"
        />
      </div>
    </div>
  );
}

/* ─── Card 3 overlay: Guardrails ─── */

function GuardrailsOverlay() {
  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex flex-1 items-center justify-center">
        <OverlayPanel>
          <div className="flex flex-col gap-3">
            <UserBubble text="Help me plan a summer trip." />
            <BotBubble text="Sorry, I can't help with that, but I can assist you with anything related to Rhythmbox." />
          </div>
        </OverlayPanel>
      </div>

      <div className="pt-3">
        <StatusPill
          icon={<AppIcon icon={ShieldCheck} size={12} className="h-3 w-3" aria-hidden="true" />}
          label="Guardrails activated"
        />
      </div>
    </div>
  );
}

/* ─── Card shell ─── */

type TrustCardProps = {
  bgSrc: string;
  bgAlt: string;
  overlay: React.ReactNode;
  eyebrow: string;
  body: string;
};

function TrustCard({ bgSrc, bgAlt, overlay, eyebrow, body }: TrustCardProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xxl border border-hairline bg-surface-card">
      <div className="relative aspect-[6/5] w-full overflow-hidden">
        <Image
          src={bgSrc}
          alt={bgAlt}
          fill
          className="object-cover"
          sizes="(min-width: 768px) 33vw, 100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/20" />
        <div className="absolute inset-0 px-5 py-4">
          {overlay}
        </div>
      </div>

      {/* Caption strip */}
      <div className="px-6 py-4">
        <p className="text-[12px] font-semibold tracking-[0.96px] uppercase text-muted">
          {eyebrow}
        </p>
        <p className="mt-1 text-body-sm text-body-strong leading-snug">
          {body}
        </p>
      </div>
    </div>
  );
}

/* ─── Section ─── */

export async function TrustShowcase() {
  const t = await getTranslations("landing.trust");
  const tc = await getTranslations("common");
  return (
    <section id="trust" className="border-t border-hairline bg-canvas py-section">
      <div className={container}>

        {/* ── Heading band ── */}
        <div className="max-w-[800px]">
          <div className="text-[12px] font-semibold tracking-[0.96px] uppercase text-muted">
            Trust &amp; security
          </div>
          <h2 className="mt-4 font-display text-display-lg tracking-tighter text-ink text-balance md:text-display-xl">
            {t("title")}
          </h2>
          <p className="mt-4 max-w-[62ch] text-body-md leading-relaxed text-body text-pretty">
            {t("subtitle")}
          </p>
          <a
            href="/dashboard"
            className="mt-6 inline-flex h-9 items-center rounded-md bg-ink px-4 py-1.5 text-button text-on-primary transition-colors hover:bg-body-strong"
          >
            {tc("learnMore")}
          </a>
        </div>

        {/* ── 3-up cards ── */}
        <div className="mt-12 grid gap-4 md:grid-cols-3">

          <TrustCard
            bgSrc="/images/background2.png"
            bgAlt="Omnichannel channels background"
            overlay={<OmnichannelOverlay />}
            eyebrow="Omnichannel agents"
            body="Connect your AI agent across every channel your customers use — chat, WhatsApp, Messenger, Instagram, email, and voice calls."
          />

          <TrustCard
            bgSrc="/images/background3.png"
            bgAlt="Secure by default background"
            overlay={<SecureOverlay />}
            eyebrow="Secure by default"
            body="Your AI Agent ensures the utmost security by refusing sensitive or unauthorized requests. Enterprise-grade security and compliance built in."
          />

          <TrustCard
            bgSrc="/images/background4.png"
            bgAlt="Enterprise-grade guardrails background"
            overlay={<GuardrailsOverlay />}
            eyebrow="Enterprise-grade guardrails"
            body="AI-powered guardrails prevent misinformation and off-topic responses, maintaining professionalism and trust in every interaction."
          />

        </div>
      </div>
    </section>
  );
}
