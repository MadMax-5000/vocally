import { SignUp } from "@clerk/nextjs";
import { getTranslations } from "next-intl/server";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { ClerkUnconfiguredMessage } from "@/components/auth/ClerkUnconfiguredMessage";
import { authClerkAppearance } from "@/lib/clerk/auth-appearance";
import { isClerkConfigured } from "@/lib/clerk/keys";

export default async function SignUpPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations("auth");
  return (
    <AuthPageShell title={t("signUpTitle")} subtitle={t("signUpSubtitle")}>
      {isClerkConfigured() ? (
        <SignUp
          appearance={authClerkAppearance}
          fallbackRedirectUrl={`/${locale}/onboarding`}
          signInFallbackRedirectUrl={`/${locale}/dashboard`}
          signInUrl={`/${locale}/sign-in`}
        />
      ) : (
        <ClerkUnconfiguredMessage />
      )}
    </AuthPageShell>
  );
}
