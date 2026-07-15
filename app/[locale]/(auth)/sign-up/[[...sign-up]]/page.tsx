import { SignUp } from "@clerk/nextjs";
import { getTranslations } from "next-intl/server";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { authClerkAppearance } from "@/lib/clerk/auth-appearance";

export default async function SignUpPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations("auth");
  return (
    <AuthPageShell title={t("signUpTitle")} subtitle={t("signUpSubtitle")}>
      <SignUp
        appearance={authClerkAppearance}
        fallbackRedirectUrl={`/${locale}/onboarding`}
        signInFallbackRedirectUrl={`/${locale}/dashboard`}
        signInUrl={`/${locale}/sign-in`}
      />
    </AuthPageShell>
  );
}
