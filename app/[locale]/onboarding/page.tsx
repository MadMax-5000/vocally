import { CreateOrganization } from "@clerk/nextjs";
import { AnselioLogo } from "@/components/brand/AnselioLogo";
import { getTranslations } from "next-intl/server";

export default async function OnboardingPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations("onboarding");
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6">
      <div className="flex flex-col items-center text-center">
        <AnselioLogo variant="black" size="lg" href="/" priority />
        <h1 className="mt-6 text-display-sm font-display tracking-tight text-ink">
          {t("title")}
        </h1>

        <p className="mt-3 max-w-md text-body-md leading-relaxed text-body">
          {t("description")}
        </p>

        <div className="mt-8 w-full max-w-md">
          <CreateOrganization
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "w-full border-0 bg-surface-card p-6 rounded-xl shadow-none",
                headerTitle: "text-display-sm font-display tracking-tight text-ink",
                headerSubtitle: "text-body-md text-body",
                formButtonPrimary: "bg-primary text-on-primary hover:bg-primary/90 active:bg-primary-active rounded-md text-button font-medium h-9",
                formFieldInput: "border border-hairline-strong rounded-md h-11 px-3 text-body-md focus:border-ink focus:border-2 focus:outline-none",
                formFieldLabel: "text-caption-uppercase text-ink font-semibold tracking-wide",
                formFieldErrorText: "text-caption text-semantic-error",
                dividerLine: "bg-hairline",
                dividerText: "text-caption text-muted",
                footerActionLink: "text-body-strong text-ink",
                identityPreviewEditButton: "text-body-strong text-ink",
                socialButtonsIconButton: "border border-hairline-strong h-11",
                identityPreviewText: "text-body-md text-ink",
                alertText: "text-body-sm text-semantic-error",
              },
            }}
            afterCreateOrganizationUrl={`/${locale}/dashboard/agents`}
          />
        </div>
      </div>
    </div>
  );
}
