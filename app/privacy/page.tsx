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
        <p className="mt-6 max-w-[70ch] text-body-md leading-relaxed text-body text-pretty">
          This privacy notice will be published soon.
        </p>
      </div>
    </main>
  );
}

