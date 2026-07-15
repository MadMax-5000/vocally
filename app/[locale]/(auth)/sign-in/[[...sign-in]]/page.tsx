import { SignIn } from "@clerk/nextjs";
import { getTranslations } from "next-intl/server";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { authClerkAppearance } from "@/lib/clerk/auth-appearance";

export default async function SignInPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations("auth");
  return (
    <AuthPageShell title={t("signInTitle")} subtitle={t("signInSubtitle")}>
      <SignIn
        appearance={authClerkAppearance}
        fallbackRedirectUrl={`/${locale}/dashboard`}
        signUpFallbackRedirectUrl={`/${locale}/onboarding`}
        signUpUrl={`/${locale}/sign-up`}
      />
    </AuthPageShell>
  );
}
